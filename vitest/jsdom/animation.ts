export function setupAnimation() {
    Element.prototype.getAnimations = () => [];
    // jsdom runs no animations: one started for a fallback path never ends, and tests end the motion with its DOM event
    Element.prototype.animate = () => ({ finished: new Promise(() => {}), playState: 'running', cancel() {} }) as unknown as Animation;
}
