import * as path from "node:path";
import {
    fileExists,
    findWorkspaceDir,
    readFile,
    readJsonFile,
    removeFile,
    writeFile,
} from "./io.js";
import type {
    Updater,
    FileCallback,
    UpdaterCallbackArg,
    FileConfig,
    UpdaterOptions,
} from "./types.js";

export function json<T>(callback: FileCallback<T>): FileConfig<T> {
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

export function updater(getFiles: UpdaterCallbackArg): Promise<void> {
    const test = process.argv.slice(2).includes("--test");
    const quiet = process.argv.slice(2).includes("--quiet");
    const workspaceDir = findWorkspaceDir();
    return performUpdates({ getFiles, workspaceDir, test, quiet });
}

export async function performUpdates(options: UpdaterOptions): Promise<void> {
    const files = options.getFiles(options.workspaceDir);
    const updatedFiles = await checkFilesForUpdates(options.workspaceDir, files);
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

async function checkFilesForUpdates(workspaceDir: string, files: Record<string, Updater<unknown>>) {
    const updaterConfigs = convertCallbacksToConfigs(files);
    return await Promise.all(
        Object.entries(updaterConfigs).map(([filename, config]) => {
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
    files: Record<string, Updater<unknown>>,
): Record<string, FileConfig<any>> {
    return Object.fromEntries(
        Object.entries(files).map(([filename, callback]) => {
            return [filename, typeof callback === "function" ? text(callback) : callback];
        }),
    );
}
