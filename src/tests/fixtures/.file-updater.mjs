import * as path from "node:path";

export default async () => {
    const cliPath = process.argv[1];
    const indexPath = path.join(path.dirname(cliPath), "index.js");
    const { updater } = await import(`file://${indexPath}`);

    await updater({});
};
