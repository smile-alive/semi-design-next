/**
 * Enter and leave keyframes that grow an element from `height: 0` or collapse it to 0 run against its auto height,
 * which only interpolates under `interpolate-size` (Chrome 129); elsewhere the height jumps halfway through. This
 * writes the element's natural height inline as a length while its animations run, so the keyframes interpolate in
 * every browser. Hosts call it once the animation class is on the element; it does nothing where interpolate-size
 * works. Removable once Firefox and Safari support interpolate-size.
 */
export function pinAnimatedHeight(element?: Element | null) {
    // Vue's transition hooks hand over an Element
    if (!(element instanceof HTMLElement) || CSS.supports('interpolate-size', 'allow-keywords')) {
        return;
    }
    const animations = element.getAnimations().filter((animation) => 'animationName' in animation);
    // a pin on a run that leaves the height alone would freeze a height the element's own style still changes
    const animatesHeight = animations.some((animation) => (animation.effect as KeyframeEffect | null)?.getKeyframes().some((keyframe) => 'height' in keyframe));
    if (!animatesHeight) {
        return;
    }
    element.style.removeProperty('height');
    // The natural height shows at the end the keyframes leave to the element's own style, the start of a collapse or
    // the end of a grow; seeking there and back fires no animation events
    const saved = animations.map((animation) => animation.currentTime);
    const heightAt = (end: boolean) => {
        for (const animation of animations) {
            animation.currentTime = end ? Number(animation.effect?.getComputedTiming().endTime ?? 0) : 0;
        }
        return element.offsetHeight;
    };
    const height = `${Math.max(heightAt(false), heightAt(true))}px`;
    animations.forEach((animation, index) => {
        if (saved[index] !== null) {
            animation.currentTime = saved[index];
        }
    });
    element.style.height = height;
    // a finished grow rests at auto again, so later content changes resize it; a collapse holds 0 through its fill
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        if (element.style.height === height) {
            element.style.removeProperty('height');
        }
    });
}
