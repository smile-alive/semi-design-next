export function setupLayout() {
    // jsdom has no checkVisibility, which the focus trap queries; all elements count as visible
    Element.prototype.checkVisibility = () => true;
    Element.prototype.scrollIntoView = () => {};
    Element.prototype.scrollTo = () => {};
    // jsdom lays nothing out and returns no client rects; one zero box per element, as getBoundingClientRect does, lets a
    // popup position against its trigger
    Element.prototype.getClientRects = function getClientRects(this: Element) {
        return [this.getBoundingClientRect()] as unknown as DOMRectList;
    };
    // jsdom reports a 0 x 0 viewport through documentElement, which would clamp every popup to its top-left corner
    Object.defineProperties(document.documentElement, {
        clientWidth: { configurable: true, get: () => window.innerWidth },
        clientHeight: { configurable: true, get: () => window.innerHeight },
    });

    global.HTMLElement.prototype.getBoundingClientRect = function () {
        return new DOMRect(parseFloat(this.style.marginLeft) || 0, parseFloat(this.style.marginTop) || 0, parseFloat(this.style.width) || 0, parseFloat(this.style.height) || 0);
    };

    global.Range.prototype.getBoundingClientRect = () => new DOMRect();
    global.Range.prototype.getClientRects = () => Object.assign([] as DOMRect[], { item: (): DOMRect | null => null });

    Object.defineProperties(global.HTMLElement.prototype, {
        offsetWidth: {
            get() {
                return parseFloat(this.style.width) || 0;
            },
        },
        offsetHeight: {
            get() {
                return parseFloat(this.style.height) || 0;
            },
        },
        offsetTop: {
            get() {
                return parseFloat(this.style.marginTop) || 0;
            },
        },
        offsetLeft: {
            get() {
                return parseFloat(this.style.marginLeft) || 0;
            },
        },
    });
}
