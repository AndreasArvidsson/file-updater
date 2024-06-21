import * as path from "node:path";
import { json, performUpdates } from "..";
import { assertFileAndContent, copyFixture, temporaryDirectory } from "./testUtils";
import { writeFile } from "../io";

const options = { test: false, quiet: true };

suite("Write", () => {
    test("No changes: callback", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "helloWorld.txt";
        copyFixture(tempDirPath, file);
        await performUpdates({
            ...options,
            workspaceDir: tempDirPath,
            getFiles: () => ({ [file]: (content) => content }),
        });
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, "Hello World");
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
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, '{\n    "name": "test"\n}\n');
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
        await performUpdates({
            ...options,
            workspaceDir: tempDirPath,
            getFiles: () => ({ ["foo.txt"]: () => "foo" }),
        });
        const filePath = path.join(tempDirPath, "foo.txt");
        assertFileAndContent(filePath, "foo");
    });

    test("Changed file: callback", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "helloWorld.txt";
        copyFixture(tempDirPath, file);
        await performUpdates({
            ...options,
            workspaceDir: tempDirPath,
            getFiles: () => ({ [file]: (content) => content + "2" }),
        });
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, "Hello World2");
    });

    test("Changed file: json", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "package.json";
        copyFixture(tempDirPath, file);
        await performUpdates({
            ...options,
            workspaceDir: tempDirPath,
            getFiles: () => ({ [file]: json(() => ({ value: 2 })) }),
        });
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, '{\n    "value": 2\n}\n');
    });

    test("New file: config", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "foo.txt";
        await performUpdates({
            ...options,
            workspaceDir: tempDirPath,
            getFiles: () => {
                return {
                    [file]: {
                        read: () => "",
                        update: () => "foo",
                        equal: (expected, actual) => expected === actual,
                        write: (filePath, expected: string) => {
                            writeFile(filePath, expected);
                        },
                    },
                };
            },
        });
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, "foo");
    });
});
