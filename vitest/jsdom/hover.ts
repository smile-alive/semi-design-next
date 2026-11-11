const native = <T>(proto: object, name: string) => Object.getOwnPropertyDescriptor(proto, name)?.value as T;

// jsdom 31 never matches `:hover`; emulate only the bare selector the Tooltip hosts query
export function setupHover() {
    let hovered: Element | null = null;
    window.addEventListener('mouseover', (event) => (hovered = event.target as Element), { capture: true });
    window.addEventListener('mouseout', (event) => (hovered = (event as MouseEvent).relatedTarget as Element | null), { capture: true });
    const hoverChain = () => {
        const chain: Element[] = [];
        for (let node: Node | null = hovered?.isConnected ? hovered : null; node; node = node instanceof ShadowRoot ? node.host : node.parentNode) {
            if (node instanceof Element) {
                chain.unshift(node);
            }
        }
        return chain;
    };
    const matches = native<(this: Element, selectors: string) => boolean>(Element.prototype, 'matches');
    Element.prototype.matches = function (this: Element, selectors: string) {
        return selectors === ':hover' ? hoverChain().includes(this) : matches.call(this, selectors);
    } as typeof Element.prototype.matches;
    for (const proto of [Document.prototype, DocumentFragment.prototype, Element.prototype]) {
        const querySelectorAll = native<(this: ParentNode, selectors: string) => NodeListOf<Element>>(proto, 'querySelectorAll');
        proto.querySelectorAll = function (this: ParentNode, selectors: string) {
            return selectors === ':hover' ? (hoverChain().filter((el) => el !== this && (this as Node).contains(el)) as unknown as NodeListOf<Element>) : querySelectorAll.call(this, selectors);
        } as typeof proto.querySelectorAll;
    }
}
