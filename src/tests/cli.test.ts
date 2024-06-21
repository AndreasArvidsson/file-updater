import assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import { cli, temporaryDirectory, throwsAsync } from "./utils";

const fixturesPath = path.join(__dirname, "fixtures");

type Fixture = "package.json" | ".file-updater-log.mjs" | ".file-updater.mjs";

function copyFixture(tmpPath: string, source: Fixture, destination?: Fixture) {
    fs.copyFileSync(path.join(fixturesPath, source), path.join(tmpPath, destination ?? source));
}

suite("cli", () => {
    test("missing package.json", async () => {
        const tempDirPath = temporaryDirectory();
        await throwsAsync(
            async () => cli(tempDirPath),
            /^Can't find workspace root containing 'package.json'/,
        );
    });

    test("missing .file-updater.mjs", async () => {
        const tempDirPath = temporaryDirectory();
        copyFixture(tempDirPath, "package.json");
        await throwsAsync(async () => cli(tempDirPath), /Can't find '.file-updater.mjs'/);
    });

    test(".file-updater-log.mjs", async () => {
        const tempDirPath = temporaryDirectory();
        copyFixture(tempDirPath, "package.json");
        copyFixture(tempDirPath, ".file-updater-log.mjs", ".file-updater.mjs");
        const stdout = await cli(tempDirPath);
        assert.equal(stdout, "fixtures/file-updater.mjs");
    });
});
