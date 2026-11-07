/**
 * Resolves a link to the element it points at, looking inside the shadow root or document that holds `root`. An href
 * starting with '#' is a fragment id, which is not always a valid CSS selector ('#', '#1-intro'), so it is looked up by
 * id; anything else is a selector and an invalid one finds nothing.
 */
export function findAnchorTarget(root: Node | null | undefined, link: string): HTMLElement | null {
    const scope = (root?.getRootNode() ?? document) as Document | ShadowRoot;
    if (link.startsWith('#')) {
        return scope.getElementById(link.slice(1));
    }
    try {
        return scope.querySelector<HTMLElement>(link);
    } catch {
        return null;
    }
}
