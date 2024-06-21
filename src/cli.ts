import * as path from "node:path";
import { fileExists, findWorkspaceDir } from "./io.js";

const CLI_ENTRY = ".file-updater.mjs";

try {
    const workspaceDir = findWorkspaceDir();

    const entryPath = path.join(workspaceDir, CLI_ENTRY).replace(/\\/g, "/");

    if (!fileExists(entryPath)) {
        throw Error(`Can't find '${CLI_ENTRY}' in '${workspaceDir}'`);
    }

    void import(`file://${entryPath}`);
} catch (error) {
    console.log((error as Error).message);
    process.exit(1);
}
