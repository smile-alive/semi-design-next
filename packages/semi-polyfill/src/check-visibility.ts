// Element.prototype.checkVisibility: Safari 17.4. Shim for Safari 17.2 and 17.3.
// Limitation: contentVisibilityAuto is ignored, content-visibility is read only as `hidden` on an ancestor. Upgrade
// when Safari 17.2 leaves the supported range.
export {};

function parentOf(node: Element) {
    return node.parentElement ?? (node.getRootNode() as Partial<ShadowRoot>).host ?? null;
}

// lib.dom declares `checkVisibility`, so `in` would narrow the prototype to never; the loosened view keeps the check meaningful.
const elementProto: Partial<Element> | undefined = typeof Element === 'undefined' ? undefined : Element.prototype;

if (elementProto && !('checkVisibility' in elementProto)) {
    elementProto.checkVisibility = function checkVisibility(this: Element, options: CheckVisibilityOptions & { opacityProperty?: boolean; visibilityProperty?: boolean } = {}) {
        if (!this.isConnected || this.getClientRects().length === 0) {
            return false;
        }
        const checkOpacity = options.checkOpacity ?? options.opacityProperty;
        const checkVisibilityCSS = options.checkVisibilityCSS ?? options.visibilityProperty;
        if (checkVisibilityCSS) {
            const { visibility } = getComputedStyle(this);
            if (visibility === 'hidden' || visibility === 'collapse') {
                return false;
            }
        }
        for (let node: Element | null = this; node; node = parentOf(node)) {
            const style = getComputedStyle(node);
            if ((checkOpacity && style.opacity === '0') || (node !== this && style.getPropertyValue('content-visibility') === 'hidden')) {
                return false;
            }
        }
        return true;
    };
}
