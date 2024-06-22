export interface FileConfig<Content> {
    // Called only if file exists
    read(filePath: string): PromiseOrValue<Content>;

    update: FileCallback<Content>;

    // Called only if (expected != null && actual != null)
    equal(expected: Content, actual: Content): PromiseOrValue<boolean>;

    // Called only if (expected !== actual) && (expected != null) and --test is not set
    write(filePath: string, expected: Content): PromiseOrValue<void>;
}

// `actual` is `null` when file doesn't exist
export type FileCallback<Content> = (
    actual: Content | null,
    options: { file: string; path: string },
) => PromiseOrValue<Content | null>;

type PromiseOrValue<T> = T | Promise<T>;

export type FileConfigOrCallback<Content> = FileConfig<Content> | FileCallback<string>;

export type FilesArg = Record<string, FileConfigOrCallback<any>>;

export interface UpdaterOptions {
    workspaceDir?: string;
    test?: boolean;
    quiet?: boolean;
}
