# file-updater

Keep files up to date in a project workspace

## Installation

```sh
npm install file-updater
```

## Usage

Create file `.file-updater.mjs` that calls the updater function. Place it in the project root next to `package.json`.

### Example

Run `npm run file-updater`

```json
"scripts": {
    "file-updater": "file-updater"
}
```

File: `.file-updater.mjs`

```ts
import { updater, json } from "file-updater";

export default (workspaceDir) => {
    return updater({
        // Simple string updater callback.
        // Get the actual text from the file on disk and return the updated expected text.
        ".gitignore": (actualText, path) => {
            return actualText + "\nlib";
        },

        // Json file using the `json()` utility.
        // Get the actual json from the file on disk and return the updated expected json.
        "package.json": json((actualManifest, path) => {
            return {
                ...actualManifest,
                author: "Andreas Arvidsson",
            };
        }),

        // Support any custom format by providing the read, update, equal and write callbacks.
        "data.csv": {
            // Read csv file on disk and return actual csv instance.
            read: (path) => csvParser.read(path),
            // Get the actual csv from the file on disk and return the updated expected csv.
            update: (actualCsv, options) => {
                return actualCsv.append("foo", "bar");
            },
            // Compare expected and actual csv instances. Return true if equal.
            equal: (expectedCsv, actualCsv) => expectedCsv.equals(actualCsv),
            // Expected and actual is not equal. Write actual csv to disk.
            write: (path, expectedCsv) => expectedCsv.write(path),
        },
    });
};
```

### Run

-   To update all affected files, run: `npm run file-updater`
-   To check if all files are up to date, run: `npm run file-updater --test`
-   To hide info logging, run: `npm run file-updater --quiet`

It's recommended to always check that all files are updated before running tests.

```json
"scripts": {
    "test": "file-updater --test && mocha"
}
```
