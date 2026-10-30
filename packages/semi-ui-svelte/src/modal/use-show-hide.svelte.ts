import { tick, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';

interface ShowHideOptions {
    visible: () => boolean;
    motion: () => boolean;
    /** Classes the foundation SCSS animates; the keyframes live only there */
    showClass: string;
    hideClass: string;
    /** The leave animation has ended, or a hide needed none */
    onHidden?: () => void;
}

/**
 * Plays the show or hide keyframes on an element that stays in the DOM, then reports a finished hide. Not an
 * `in:` / `out:` transition: those run when a block is created or destroyed, while a keepDOM dialog must keep its nodes
 * (and the state inside them) between openings.
 */
export default function useShowHide({ visible, motion, showClass, hideClass, onHidden }: ShowHideOptions) {
    let node = $state.raw<HTMLElement | null>(null);

    // true from a show until the leave has ended, so the element is laid out the whole time it can be seen
    let displayed = $state(untrack(visible));

    // true while the show or hide class is applied
    let animating = $state(false);
    let first = true;

    // identifies the latest animation check, so a check of a replaced run does nothing
    let runs = 0;

    const finish = () => {
        animating = false;
        if (!visible()) {
            displayed = false;
            onHidden?.();
        }
    };

    const attach: Attachment<HTMLElement> = (element) => {
        node = element;
        const controller = new AbortController();
        // animation events bubble; a descendant's animation is not this run
        element.addEventListener(
            'animationend',
            (event) => {
                if (event.target === element && animating) {
                    finish();
                }
            },
            { signal: controller.signal }
        );
        return () => {
            controller.abort();
            node = null;
        };
    };

    // before the DOM updates, so the element is displayed in the same commit that applies the class
    $effect.pre(() => {
        const isVisible = visible();
        const withMotion = motion();
        untrack(() => {
            if (isVisible) {
                displayed = true;
            }
            // a dialog that was never shown has nothing to leave
            animating = withMotion && !(first && !isVisible);
            first = false;
            if (!animating && !isVisible) {
                finish();
            }
        });
    });

    // No animationend arrives when the page disables the animation (`animation: none`); getAnimations() flushes style,
    // so it lists the animation the class started. Transitions never fire animationend, so they do not count. The pre
    // effect above writes `animating` while the flush runs, so the class reaches the DOM in the next pass of it, after
    // this effect: the check waits for tick(), which flushes that pass.
    $effect(() => {
        const element = node;
        if (!animating || !element) return;
        const run = ++runs;
        void tick().then(() => {
            if (run === runs && animating && element.isConnected && !element.getAnimations().some((animation) => 'animationName' in animation)) {
                finish();
            }
        });
    });

    return {
        attach,
        get displayed() {
            return displayed;
        },
        get className() {
            return animating ? (visible() ? showClass : hideClass) : '';
        },
    };
}
