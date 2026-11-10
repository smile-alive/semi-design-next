// Imperative APIs mount into document.body. Failing here names the API and its hook instead of surfacing "document is
// not defined" from deep inside a server render.
export function assertClient(api: string, hint: string) {
    if (typeof document === 'undefined') {
        throw new Error(`${api} mounts into the document, which a server render does not have, so it can only be called in the browser: call it from an event handler or an effect after mount, or use ${hint} inside a component.`);
    }
}
