declare var process: {
    env: {
        VERSION: string;
    };
};

declare interface Window {
    [key: string]: any;
}

declare var __JS_GLOBAL_SCOPE__: string;

type Nullable<T> = T | null | undefined;