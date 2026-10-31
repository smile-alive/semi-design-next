<script lang="ts">
    import { strings } from '@fibrae/semi-foundation/button/constants';
    import { resolveButtonLooks } from '@fibrae/semi-foundation/button/utils';
    import useDefaultProps from '../_base/use-default-props.js';
    import Button from '../button/button.svelte';
    import { getButtonGroupContext } from '../button/context.js';
    import { getInputGroupInScope } from '../input/context.js';
    import type { IconButtonProps } from './interface.js';

    const defaults = useDefaultProps('IconButton');

    let {
        block = defaults('block', false),
        colorful,
        contentClassName = defaults('contentClassName'),
        disabled,
        htmlType = defaults('htmlType', 'button'),
        iconPosition = defaults('iconPosition', strings.DEFAULT_ICON_POSITION),
        loading = defaults('loading', false),
        noHorizontalPadding = defaults('noHorizontalPadding', false),
        size,
        theme,
        type,
        ...rest
    }: IconButtonProps = $props();

    const group = getButtonGroupContext();

    const inputGroup = getInputGroupInScope();

    // Resolved here so the inner Button reads the IconButton global key, never its own.
    // The resolved looks are passed down as own values, so the InputGroup must be folded in here too.
    const looks = $derived(
        resolveButtonLooks({ disabled, size, type, theme, colorful }, group ?? inputGroup, {
            disabled: defaults('disabled'),
            size: defaults('size'),
            type: defaults('type'),
            theme: defaults('theme'),
            colorful: defaults('colorful'),
        })
    );
</script>

<!-- An empty contentClassName stops the inner Button from falling back to its own global key -->
<Button {...rest} {...looks} {block} contentClassName={contentClassName ?? ''} {htmlType} {iconPosition} {loading} {noHorizontalPadding} />
