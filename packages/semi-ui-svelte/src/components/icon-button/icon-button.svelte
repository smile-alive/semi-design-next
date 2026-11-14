<script lang="ts">
    import { strings } from '@fibrae/semi-foundation/components/button/constants';
    import { resolveButtonLooks } from '@fibrae/semi-foundation/components/button/utils';
    import { useDefaultProps } from '../../base/index.js';
    import Button from '../button/button.svelte';
    import { getButtonGroupInScope } from '../button/context.js';
    import { getInputGroupInScope } from '../input/context.js';
    import type { IconButtonProps } from './interface.js';

    const defaults = useDefaultProps('IconButton');

    let {
        block = defaults('block', false),
        classNames = defaults('classNames'),
        colorful,
        disabled,
        htmlType = defaults('htmlType', 'button'),
        iconPosition = defaults('iconPosition', strings.DEFAULT_ICON_POSITION),
        loading = defaults('loading', false),
        noHorizontalPadding = defaults('noHorizontalPadding', false),
        size,
        styles = defaults('styles'),
        theme,
        type,
        ...rest
    }: IconButtonProps = $props();

    const group = getButtonGroupInScope();
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

<!-- Empty classNames and styles stop the inner Button from falling back to its own global keys -->
<Button {...rest} {...looks} {block} classNames={classNames ?? {}} {htmlType} {iconPosition} {loading} {noHorizontalPadding} styles={styles ?? {}} />
