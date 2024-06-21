import * as path from "node:path";
import { fileExists, findWorkspaceDir } from "./io";

const CLI_ENTRY = ".file-updater.mjs";

const workspaceDir = findWorkspaceDir();

const entryPath = path.join(workspaceDir, CLI_ENTRY).replace(/\\/g, "/");

if (!fileExists(entryPath)) {
    console.error(`Can't find '${CLI_ENTRY}' in '${workspaceDir}'`);
    process.exit(1);
}

void import(`file://${entryPath}`);
