import * as path from "node:path";
import {
    fileExists,
    findWorkspaceDir,
    makeDirs,
    readFile,
    readJsonFile,
    removeFile,
    writeFile,
} from "./io.js";
import type {
    FileCallback,
    FileConfig,
    FileConfigOrCallback,
    FilesArg,
    UpdaterOptions,
} from "./types.js";

export function json<T extends object>(callback: FileCallback<T>): FileConfig<T> {
    return {
        read: (filePath) => {
            return readJsonFile(filePath) as T;
        },
        update: (content, filePath) => {
            return callback(content, filePath);
        },
        equal: (expected, actual) => {
            return JSON.stringify(expected) === JSON.stringify(actual);
        },
        write: (filePath, expected) => {
            const jsonString = JSON.stringify(expected, null, 4) + "\n";
            return writeFile(filePath, jsonString);
        },
    };
}

function text(callback: FileCallback<string>): FileConfig<string> {
    return {
        read: (filePath) => {
            return readFile(filePath).toString("utf8");
        },
        update: (content, filePath) => {
            return callback(content, filePath);
        },
        equal: (expected, actual) => {
            return expected === actual;
        },
        write: (filePath, expected) => {
            return writeFile(filePath, expected);
        },
    };
}

export function updater(files: FilesArg): Promise<void> {
    try {
        const test = process.argv.slice(2).includes("--test");
        const quiet = process.argv.slice(2).includes("--quiet");
        return updaterWithOptions(files, { test, quiet });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`ERROR: ${message}`);
        process.exit(1);
    }
}

export async function updaterWithOptions(files: FilesArg, options: UpdaterOptions): Promise<void> {
    const workspaceDir = options.workspaceDir ?? findWorkspaceDir();
    const fileConfigs = convertCallbacksToConfigs(files);
    const updatedFiles = await checkFilesForUpdates(fileConfigs, workspaceDir);
    const changedFiles = updatedFiles.filter((f) => !f.equal);
    const log = options.quiet ? () => {} : (msg: string) => console.log(msg);

    if (changedFiles.length === 0) {
        log("Updater found no changes to files.");
        return;
    }

    const msg = `Updater found changes to ${changedFiles.length} files:`;

    if (options.test) {
        const msgParts = [msg];
        for (const file of changedFiles) {
            msgParts.push(file.toString());
        }
        throw Error(msgParts.join("\n"));
    }

    log(msg);
    for (const file of changedFiles) {
        log(file.toString());
        await file.write();
    }
}

async function checkFilesForUpdates(
    files: Record<string, FileConfig<unknown>>,
    workspaceDir: string,
) {
    return await Promise.all(
        Object.entries(files).map(([filename, config]) => {
            return checkFileForUpdates(workspaceDir, filename, config);
        }),
    );
}

async function checkFileForUpdates(
    workspaceDir: string,
    file: string,
    config: FileConfig<unknown>,
) {
    const filePath = path.join(workspaceDir, file);
    const contentActual = fileExists(filePath)
        ? await Promise.resolve(config.read(filePath))
        : null;
    const contentExpected = await Promise.resolve(
        config.update(contentActual, { file, path: filePath }),
    );
    const relativePath = path.relative(workspaceDir, filePath).replace(/\\/g, "/");
    const equal = await isEqual(config, contentExpected, contentActual);
    return {
        equal,
        toString: () => `    ${relativePath}`,
        write: () => write(config, filePath, contentExpected),
    };
}

async function write(config: FileConfig<unknown>, filePath: string, expected: unknown) {
    if (expected == null) {
        removeFile(filePath);
    } else {
        makeDirs(path.dirname(filePath));
        await Promise.resolve(config.write(filePath, expected));
    }
}

async function isEqual(
    config: FileConfig<unknown>,
    expected: unknown,
    actual: unknown,
): Promise<boolean> {
    return (
        (actual == null && expected == null) ||
        (actual != null &&
            expected != null &&
            (await Promise.resolve(config.equal(expected, actual))))
    );
}

function convertCallbacksToConfigs(
    files: Record<string, FileConfigOrCallback<unknown>>,
): Record<string, FileConfig<any>> {
    return Object.fromEntries(
        Object.entries(files).map(([filename, callback]) => {
            return [filename, typeof callback === "function" ? text(callback) : callback];
        }),
    );
}
