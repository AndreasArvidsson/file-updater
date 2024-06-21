import * as fs from "node:fs";
import * as path from "node:path";

export function readJsonFile(filePath: string): object {
    const buffer = readFile(filePath);
    // Unlike `buffer.toString()` `TextDecoder` will remove BOM.
    const data = new TextDecoder().decode(buffer);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(data);
}

export function readFile(filePath: string): Buffer {
    return fs.readFileSync(filePath);
}

export function writeFile(filePath: string, data: string): void {
    fs.writeFileSync(filePath, data, "utf8");
}

export function removeFile(filePath: string): void {
    fs.unlinkSync(filePath);
}

export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

export function findWorkspaceDir(): string {
    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, "package.json");
    if (fileExists(packageJsonPath)) {
        return cwd;
    }
    throw Error(
        `Can't find workspace root containing 'package.json' at '${cwd}'`
    );
}
