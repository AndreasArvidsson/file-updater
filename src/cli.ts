#!/usr/bin/env node

import * as path from "node:path";
import { fileExists, findWorkspaceDir } from "./io.js";

const CLI_ENTRY = ".file-updater.mjs";

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

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await Promise.resolve(cli(workspaceDir));
    } catch (error) {
        const { message } = error as Error;
        console.error(`ERROR: ${message}`);
        process.exit(1);
    }
})();
