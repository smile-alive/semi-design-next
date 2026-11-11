// jsdom has no pointer capture; tests fire a captured pointer's events on the capturing element.
export function setupPointerCapture() {
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.hasPointerCapture = () => false;
}
