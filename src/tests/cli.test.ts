import assert from "node:assert";
import { cli, copyFixture, temporaryDirectory, throwsAsync } from "./testUtils";

suite("cli", () => {
    test("missing package.json", async () => {
        const tempDirPath = temporaryDirectory();
        await throwsAsync(
            cli(tempDirPath),
            /^ERROR: Can't find workspace root containing 'package.json'/,
        );
    });

    test("missing .file-updater.mjs", async () => {
        const tempDirPath = temporaryDirectory();
        copyFixture(tempDirPath, "package.json");
        await throwsAsync(cli(tempDirPath), /^ERROR: Can't find file '.file-updater.mjs'/);
    });

    test(".file-updater-log.mjs", async () => {
        const tempDirPath = temporaryDirectory();
        copyFixture(tempDirPath, "package.json");
        copyFixture(tempDirPath, ".file-updater-log.mjs", ".file-updater.mjs");
        const stdout = await cli(tempDirPath);
        assert.equal(stdout, "fixtures/file-updater.mjs");
    });

    test(".file-updater.mjs", async () => {
        const tempDirPath = temporaryDirectory();
        copyFixture(tempDirPath, "package.json");
        copyFixture(tempDirPath, ".file-updater.mjs");
        const stdout = await cli(tempDirPath);
        assert.equal(stdout, "Updater found no changes to files.");
    });
});
