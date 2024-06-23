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
import { createLogger, logError } from "./logger.js";
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
        logError(message);
        process.exit(1);
    }
}

export async function updaterWithOptions(
    files: FilesArg,
    options: UpdaterOptions = {},
): Promise<void> {
    const logger = createLogger(options);

    logger.info("Running updater...");

    const workspaceDir = options.workspaceDir ?? findWorkspaceDir();
    const fileConfigs = convertCallbacksToConfigs(files);
    const updatedFiles = await checkFilesForUpdates(fileConfigs, workspaceDir);
    const changedFiles = updatedFiles.filter((f) => !f.equal);

    if (changedFiles.length === 0) {
        logger.info("Updater found no changes to files.");
        return;
    }

    const fileOrFiles = changedFiles.length === 1 ? "file" : "files";
    const msg = `Updater found changes to ${changedFiles.length} ${fileOrFiles}!`;

    if (options.test) {
        for (const file of changedFiles) {
            logger.warn(file.file);
        }
        throw Error(msg);
    }

    for (const file of changedFiles) {
        logger.info(file.file);
        await file.write();
    }
    logger.info(msg);
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
    const equal = await isEqual(config, contentExpected, contentActual);
    return {
        file,
        equal,
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
