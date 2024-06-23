import { updaterWithOptions } from "..";
import { logError } from "../logger";
import { temporaryDirectory } from "./testUtils";

void (async () => {
    await updaterWithOptions(
        {
            ["newFile.txt"]: () => null,
        },
        { workspaceDir: temporaryDirectory() },
    );

    console.log();

    await updaterWithOptions(
        {
            ["newFile.txt"]: () => "foo",
        },
        { workspaceDir: temporaryDirectory() },
    );

    console.log();

    await updaterWithOptions(
        {
            ["newFile.txt"]: () => "foo",
            ["foo/newFile2.txt"]: () => "foo",
        },
        { workspaceDir: temporaryDirectory() },
    );

    console.log();

    try {
        await updaterWithOptions(
            {
                ["newFile.txt"]: () => "foo",
                ["foo/newFile2.txt"]: () => "foo",
            },
            { workspaceDir: temporaryDirectory(), test: true },
        );
    } catch (error) {
        logError((error as Error).message);
    }
})();
