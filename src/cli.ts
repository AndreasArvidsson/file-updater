#!/usr/bin/env node

import * as path from "node:path";
import { fileExists, findWorkspaceDir } from "./io.js";

const CLI_ENTRY = ".file-updater.mjs";

type ExportedFunction = (workspaceDir: string) => unknown;

void (async () => {
    try {
        const workspaceDir = findWorkspaceDir();

        const entryPath = path.join(workspaceDir, CLI_ENTRY).replace(/\\/g, "/");

        if (!fileExists(entryPath)) {
            throw Error(`Can't find file '${CLI_ENTRY}' in '${workspaceDir}'`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { default: cli } = await import(`file://${entryPath}`);

        if (typeof cli !== "function") {
            throw Error(`${CLI_ENTRY} should export a function as default`);
        }

        const returnValue = (cli as ExportedFunction)(workspaceDir);

        await Promise.resolve(returnValue);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`ERROR: ${message}`);
        process.exit(1);
    }
})();
