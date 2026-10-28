import { useAttrs } from 'vue';
import { hasClickListener } from '../_base/control-attrs';
import { groupRole } from '../_base/group-role';

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
            return groupRole(attrs);
        },
        tabindex: () => (clickable() ? 0 : undefined),
        onKeydown: (event: KeyboardEvent) => {
            // keys typed in a focusable child (an input in the title) must not switch the step
            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault(); // Space would otherwise scroll the page
                // a real click runs the click listeners and the change exactly as a pointer does
                (event.currentTarget as HTMLElement).click();
            }
        },
    };
}
