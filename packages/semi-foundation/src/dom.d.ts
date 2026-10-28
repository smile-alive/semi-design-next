// DOM options that Chrome ships but TypeScript's lib.dom does not declare yet; delete each one once lib.dom has it.
// Not an entry of vp pack, so the patch stays out of the published types.

interface ScrollIntoViewOptions {
    container?: 'all' | 'nearest';
}

interface ColorSelectionOptions {
    signal?: AbortSignal;
}

interface ColorSelectionResult {
    sRGBHex: string;
}

interface EyeDropper {
    open(options?: ColorSelectionOptions): Promise<ColorSelectionResult>;
}

interface Window {
    // optional: desktop Chrome has it, Chrome on Android does not
    EyeDropper?: new () => EyeDropper;
}
