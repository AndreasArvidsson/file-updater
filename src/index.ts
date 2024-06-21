import * as path from "node:path";
import {
    findWorkspaceDir,
    readFile,
    readJsonFile,
    removeFile,
    writeFile,
} from "./io";
import type {
    Updater,
    FileCallback,
    UpdaterCallbackArg,
    FileConfig,
    UpdaterOptions,
} from "./types";

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
    return updaterWithOptions({ getFiles, test, quiet });
}

export async function updaterWithOptions(
    options: UpdaterOptions
): Promise<void> {
    const workspaceDir = findWorkspaceDir();
    const files = options.getFiles(workspaceDir);
    const updaterConfigs = convertCallbacksToConfigs(files);
    const updatedFiles = await performUpdates(workspaceDir, updaterConfigs);
    const changedFiles = updatedFiles.filter((f) => !f.equal);

    const log = options.quiet ? () => {} : (msg: string) => console.log(msg);

    if (changedFiles.length === 0) {
        log("Updater found no changes to files.");
        return;
    }

    const msg = `Updater found changes to ${changedFiles.length} files:`;

    if (options.test) {
        console.error(`ERROR: ${msg}`);
        for (const file of changedFiles) {
            console.error(file.toString());
        }
        process.exit(1);
    }

    log(msg);
    for (const file of changedFiles) {
        log(file.toString());
        await file.write();
    }
}

async function performUpdates(
    workspaceDir: string,
    replacers: Record<string, FileConfig<unknown>>
) {
    return await Promise.all(
        Object.entries(replacers).map(([filename, config]) => {
            return performUpdate(workspaceDir, filename, config);
        })
    );
}

async function performUpdate(
    workspaceDir: string,
    file: string,
    config: FileConfig<unknown>
) {
    const filePath = path.join(workspaceDir, file);
    const contentActual = await Promise.resolve(config.read(filePath));
    const contentExpected = await Promise.resolve(
        config.update(contentActual, { file, path: filePath })
    );
    const relativePath = path
        .relative(workspaceDir, filePath)
        .replace(/\\/g, "/");
    const equal = await isEqual(config, contentExpected, contentActual);
    return {
        equal,
        toString: () => `    ${relativePath}`,
        write: () => write(config, filePath, contentExpected),
    };
}

async function write(
    config: FileConfig<unknown>,
    filePath: string,
    expected: unknown
) {
    if (expected == null) {
        removeFile(filePath);
    } else {
        await Promise.resolve(config.write(filePath, expected));
    }
}

async function isEqual(
    config: FileConfig<unknown>,
    expected: unknown,
    actual: unknown
): Promise<boolean> {
    return (
        (actual == null && expected == null) ||
        (actual != null &&
            expected != null &&
            (await Promise.resolve(config.equal(expected, actual))))
    );
}

function convertCallbacksToConfigs(
    replacers: Record<string, Updater<unknown>>
): Record<string, FileConfig<any>> {
    return Object.fromEntries(
        Object.entries(replacers).map(([filename, callback]) => {
            return [
                filename,
                typeof callback === "function" ? text(callback) : callback,
            ];
        })
    );
}
