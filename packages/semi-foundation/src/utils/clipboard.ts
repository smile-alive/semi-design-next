// Resolves false instead of rejecting, so callers report failure through their own callbacks rather than leaking
// unhandled rejections; no execCommand fallback because the app is served over HTTPS only
export function copyText(text: string) {
    return navigator.clipboard.writeText(text).then(
        () => true,
        () => false
    );
}
