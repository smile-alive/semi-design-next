<script lang="ts">
    import type { Attachment } from 'svelte/attachments';
    import { SvelteSet } from 'svelte/reactivity';
    import { cssClasses } from '@fibrae/semi-foundation/button/constants';
    import { inheritGroupLooks } from '@fibrae/semi-foundation/button/utils';
    import '@fibrae/semi-foundation/button/button.scss';
    import { getPopupLayerContext } from '../_base/popup-layer.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import { getInputGroupInScope } from '../input/context.js';
    import { getButtonGroupContext, setButtonGroupContext } from './context.js';
    import type { ButtonGroupProps } from './interface.js';

    const defaults = useDefaultProps('ButtonGroup');
    let { colorful = defaults('colorful'), disabled = defaults('disabled'), size = defaults('size'), theme = defaults('theme'), type = defaults('type'), children, ...rest }: ButtonGroupProps = $props();

    const outer = getButtonGroupContext();
    const layer = getPopupLayerContext();

    const buttons = new SvelteSet<HTMLElement>();

    // Bumped when the group's DOM changes: a keyed reorder moves buttons without adding or removing one
    let order = $state(0);

    const prefix = cssClasses.PREFIX;
    const inputGroup = getInputGroupInScope();

    // A nested group inherits the outer one, which has already folded in the InputGroup
    const inherited = $derived(inheritGroupLooks({ colorful, disabled, size, theme, type }, outer ?? inputGroup));

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
