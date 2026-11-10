import { useAttrs } from 'vue';
import { namedRole } from '@fibrae/semi-foundation/utils';
import { hasClickListener } from '../../utils/index';

/**
 * The click and keyboard behavior every step type shares: a step is a button when its Steps listens for changes
 * or it has its own click listener. attrs are not reactive, so the getters are called while rendering.
 */
export function useStepItem(clickableByParent: () => boolean) {
    const attrs = useAttrs();

    const clickable = () => clickableByParent() || hasClickListener(attrs);

    return {
        clickable,
        role: () => {
            if (clickable()) return 'button';
            return namedRole(attrs);
        },
        tabindex: () => (clickable() ? 0 : undefined),
        onKeydown: (event: KeyboardEvent) => {
            // keys typed in a focusable child (an input in the title) must not switch the step
            if (event.target === event.currentTarget && event.currentTarget instanceof HTMLElement && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault(); // Space would otherwise scroll the page
                event.currentTarget.click();
            }
        },
    };
}
