import { json, performUpdates } from "..";
import { copyFixture, temporaryDirectory, throwsAsync } from "./testUtils";

const options = { test: true, quiet: true };

suite("Test", () => {
    test("No changes: callback", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "helloWorld.txt";
        copyFixture(tempDirPath, file);
        await performUpdates({
            ...options,
            workspaceDir: tempDirPath,
            getFiles: () => ({ [file]: (content) => content }),
        });
    });

    test("No changes: json", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "package.json";
        copyFixture(tempDirPath, file);
        await performUpdates({
            ...options,
            workspaceDir: tempDirPath,
            getFiles: () => ({ [file]: json((content: object | null) => content) }),
        });
    });

    test("No changes: config", async () => {
        const tempDirPath = temporaryDirectory();
        await performUpdates({
            ...options,
            workspaceDir: tempDirPath,
            getFiles: () => {
                return {
                    ["unknown"]: {
                        read: () => "Hello, world!",
                        update: (content: string) => content,
                        equal: (expected, actual) => expected === actual,
                        write: () => {},
                    },
                };
            },
        });
    });

    test("New file: callback", async () => {
        const tempDirPath = temporaryDirectory();
        await throwsAsync(
            performUpdates({
                ...options,
                workspaceDir: tempDirPath,
                getFiles: () => ({ ["foo.txt"]: () => "foo" }),
            }),
        );
    });

    test("Changed file: callback", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "helloWorld.txt";
        copyFixture(tempDirPath, file);
        await throwsAsync(
            performUpdates({
                ...options,
                workspaceDir: tempDirPath,
                getFiles: () => ({ [file]: (content) => content + "2" }),
            }),
        );
    });

    test("Changed file: json", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "package.json";
        copyFixture(tempDirPath, file);
        await throwsAsync(
            performUpdates({
                ...options,
                workspaceDir: tempDirPath,
                getFiles: () => ({ [file]: json(() => ({ value: 2 })) }),
            }),
        );
    });

    test("Changes: config", async () => {
        const tempDirPath = temporaryDirectory();
        await throwsAsync(
            performUpdates({
                ...options,
                workspaceDir: tempDirPath,
                getFiles: () => {
                    return {
                        ["unknown"]: {
                            read: () => "Hello, world!",
                            update: (content: string) => content + "2",
                            equal: (expected, actual) => expected === actual,
                            write: () => {},
                        },
                    };
                },
            }),
        );
    });
});
