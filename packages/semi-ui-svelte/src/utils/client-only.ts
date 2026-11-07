// Imperative APIs mount into document.body, which a server render does not have. Failing here names the API instead of
// surfacing "document is not defined" from deep inside.
export function assertClient(api: string, hook: string) {
    if (typeof document === 'undefined') {
        throw new Error(`${api} mounts into the document and can only be called in the browser; call it from onMount or an event handler, or use ${hook} inside a component.`);
    }
}
