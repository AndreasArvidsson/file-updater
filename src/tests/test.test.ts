import { json, updaterWithOptions } from "..";
import { copyFixture, temporaryDirectory, throwsAsync } from "./testUtils";

const options = { test: true, quiet: true };

suite("Test", () => {
    test("No changes: callback", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "helloWorld.txt";
        copyFixture(tempDirPath, file);
        await updaterWithOptions(
            { [file]: (content) => content },
            {
                ...options,
                workspaceDir: tempDirPath,
            },
        );
    });

    test("No changes: json", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "package.json";
        copyFixture(tempDirPath, file);
        await updaterWithOptions(
            { [file]: json((content: object | null) => content) },
            {
                ...options,
                workspaceDir: tempDirPath,
            },
        );
    });

    test("No changes: config", async () => {
        const tempDirPath = temporaryDirectory();
        await updaterWithOptions(
            {
                ["unknown"]: {
                    read: () => "Hello, world!",
                    update: (content: string) => content,
                    equal: (expected, actual) => expected === actual,
                    write: () => {},
                },
            },
            {
                ...options,
                workspaceDir: tempDirPath,
            },
        );
    });

    test("New file: callback", async () => {
        const tempDirPath = temporaryDirectory();
        await throwsAsync(
            updaterWithOptions(
                { ["foo.txt"]: () => "foo" },
                {
                    ...options,
                    workspaceDir: tempDirPath,
                },
            ),
        );
    });

    test("Changed file: callback", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "helloWorld.txt";
        copyFixture(tempDirPath, file);
        await throwsAsync(
            updaterWithOptions(
                { [file]: (content) => content + "2" },
                {
                    ...options,
                    workspaceDir: tempDirPath,
                },
            ),
        );
    });

    test("Changed file: json", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "package.json";
        copyFixture(tempDirPath, file);
        await throwsAsync(
            updaterWithOptions(
                { [file]: json(() => ({ value: 2 })) },
                {
                    ...options,
                    workspaceDir: tempDirPath,
                },
            ),
        );
    });

    test("Changes: config", async () => {
        const tempDirPath = temporaryDirectory();
        await throwsAsync(
            updaterWithOptions(
                {
                    ["unknown"]: {
                        read: () => "Hello, world!",
                        update: (content: string) => content + "2",
                        equal: (expected, actual) => expected === actual,
                        write: () => {},
                    },
                },
                {
                    ...options,
                    workspaceDir: tempDirPath,
                },
            ),
        );
    });
});
