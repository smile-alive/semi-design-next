export function elt(tag: string, className: string, style?: { [key: string]: string }) {
    const el = document.createElement(tag);
    el.className = className;
    if (style) {
        setStyles(el, style);
    }
    return el;
}

export function setStyles(element: HTMLElement, styles: { [key: string]: string }) {
    Object.assign(element.style, styles);
}

export function getLineElement(node: Node): HTMLElement | null {
    return node.parentElement?.closest('[data-line-element="true"]') || null;
}
