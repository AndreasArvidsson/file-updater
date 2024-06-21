# file-updater

Keep files up to date in a project workspace

## Installation

```sh
npm install file-updater
```

## Usage

Create file `.file-updater.mjs` that calls the updater function.

### Example

```ts
// File: `.file-updater.mjs`
import { updater, json } from "file-updater";

updater((workspaceDir) => {
    return {
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

        // Support any custom format by providing the read, updates, equal and write callbacks.
        ".csv": {
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
    };
});
```

### Run

-   To update all affected files, run: `npm run file-updater`
-   To check if all files are up to date, run: `npm run file-updater --test`
-   To hide info logging, run: `npm run file-updater --quiet`

It's recommended to always check that all files are updated before running tests.

```json
{
    "test": "file-updater --test && mocha"
}
```
