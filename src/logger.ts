import type { UpdaterOptions } from "./types";

export const logError = (msg: string) => console.log(`[ERROR] ${msg}`);

export function createLogger(options: UpdaterOptions) {
    if (options.quiet) {
        return {
            info: () => {},
            warn: () => {},
        };
    }
    return {
        info: (msg: string) => console.log(msg),
        warn: (msg: string) => console.warn(`[WARN] ${msg}`),
    };
}
