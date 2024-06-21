import assert from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { v4 as uuid } from "uuid";

export function temporaryDirectory(): string {
    const dirPath = path.join(os.tmpdir(), uuid());

    fs.mkdirSync(dirPath, { recursive: true });

    return dirPath;
}

export async function throwsAsync(
    callback: () => Promise<unknown>,
    expectedError?: RegExp | string,
) {
    try {
        await callback();
        assert.fail("Expected an error to be thrown");
    } catch (error) {
        if (expectedError != null) {
            const message = (error as Error).message;
            if (expectedError instanceof RegExp) {
                assert.ok(
                    expectedError.test(message),
                    `Exception message '${message}' did not match: ${expectedError}`,
                );
            } else {
                assert.strictEqual(message, expectedError, `Unexpected exception message`);
            }
        }
    }
}

export async function cli(cwd: string): Promise<string> {
    const cliPath = path.join(__dirname, "../../lib/cli.js");
    const { execa } = await import("execa");
    try {
        const { stdout } = await execa("node", [cliPath], { cwd });
        return stdout;
    } catch (error) {
        const { stderr, stdout, shortMessage } = error as {
            stderr?: string;
            stdout?: string;
            shortMessage: string;
        };
        const message = stderr || stdout || shortMessage;
        throw Error(message);
    }
}
