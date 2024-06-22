import * as path from "node:path";
import { json, updaterWithOptions } from "..";
import { assertFileAndContent, copyFixture, temporaryDirectory } from "./testUtils";
import { writeFile } from "../io";

const options = { test: false, quiet: true };

suite("Write", () => {
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
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, "Hello World");
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
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, '{\n    "name": "test"\n}\n');
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
        await updaterWithOptions(
            { ["foo.txt"]: () => "foo" },
            {
                ...options,
                workspaceDir: tempDirPath,
            },
        );
        const filePath = path.join(tempDirPath, "foo.txt");
        assertFileAndContent(filePath, "foo");
    });

    test("Changed file: callback", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "helloWorld.txt";
        copyFixture(tempDirPath, file);
        await updaterWithOptions(
            { [file]: (content) => content + "2" },
            {
                ...options,
                workspaceDir: tempDirPath,
            },
        );
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, "Hello World2");
    });

    test("Changed file: json", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "package.json";
        copyFixture(tempDirPath, file);
        await updaterWithOptions(
            { [file]: json(() => ({ value: 2 })) },
            {
                ...options,
                workspaceDir: tempDirPath,
            },
        );
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, '{\n    "value": 2\n}\n');
    });

    test("New file: config", async () => {
        const tempDirPath = temporaryDirectory();
        const file = "foo.txt";
        await updaterWithOptions(
            {
                [file]: {
                    read: () => "",
                    update: () => "foo",
                    equal: (expected, actual) => expected === actual,
                    write: (filePath, expected: string) => {
                        writeFile(filePath, expected);
                    },
                },
            },
            {
                ...options,
                workspaceDir: tempDirPath,
            },
        );
        const filePath = path.join(tempDirPath, file);
        assertFileAndContent(filePath, "foo");
    });
});
