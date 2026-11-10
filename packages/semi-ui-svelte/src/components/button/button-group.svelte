<script lang="ts">
    import type { Attachment } from 'svelte/attachments';
    import { SvelteSet } from 'svelte/reactivity';
    import { cssClasses } from '@fibrae/semi-foundation/components/button/constants';
    import { inheritGroupLooks } from '@fibrae/semi-foundation/components/button/utils';
    import '@fibrae/semi-foundation/components/button/button.scss';
    import { getPopupLayerContext, useDefaultProps } from '../../base/index.js';
    import { getInputGroupInScope } from '../input/context.js';
    import { getButtonGroupInScope, setButtonGroupContext } from './context.js';
    import type { ButtonGroupProps } from './interface.js';

    const defaults = useDefaultProps('ButtonGroup');
    let { colorful, disabled, size, theme, type, children, ...rest }: ButtonGroupProps = $props();

    const layer = getPopupLayerContext();

    const buttons = new SvelteSet<HTMLElement>();

    // Bumped when the group's DOM changes: a keyed reorder moves buttons without adding or removing one
    let order = $state(0);

    const prefix = cssClasses.PREFIX;
    const outer = getButtonGroupInScope();
    const inputGroup = getInputGroupInScope();

    // A nested group inherits the outer one, which has already folded in the InputGroup; the group's global defaults
    // come after both
    const inherited = $derived(inheritGroupLooks(inheritGroupLooks({ colorful, disabled, size, theme, type }, outer ?? inputGroup), { colorful: defaults('colorful'), disabled: defaults('disabled'), size: defaults('size'), theme: defaults('theme'), type: defaults('type') }));

    setButtonGroupContext({
        layer,
        get colorful() {
            return inherited.colorful;
        },
        get disabled() {
            return inherited.disabled;
        },
        get size() {
            return inherited.size;
        },
        get theme() {
            return inherited.theme;
        },
        get type() {
            return inherited.type;
        },
        add: (button) => buttons.add(button),
        remove: (button) => buttons.delete(button),
        hasNext: (button) => order >= 0 && [...buttons].some((other) => other !== button && Boolean(button.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING)),
    });

    const trackOrder: Attachment<HTMLDivElement> = (node) => {
        const observer = new MutationObserver(() => order++);
        observer.observe(node, { childList: true, subtree: true });
        return () => observer.disconnect();
    };
</script>

<div role="group" {...rest} {@attach trackOrder} class={[`${prefix}-group`, rest.class]}>
    {@render children?.()}
</div>
