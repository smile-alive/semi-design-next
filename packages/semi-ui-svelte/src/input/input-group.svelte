<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/input/constants';
    import '@fibrae/semi-foundation/input/input.scss';
    import { getPopupLayerContext } from '../_base/popup-layer.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import FormLabel from '../form/label.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import { setInputGroupContext } from './context.js';
    import type { InputGroupProps } from './interface.js';

    const defaults = useDefaultProps('InputGroup');
    let { size = defaults('size'), disabled = defaults('disabled'), label = defaults('label'), labelPosition = defaults('labelPosition'), fieldLabel, labelExtra, onFocus, onBlur, children, ...rest }: InputGroupProps = $props();

    const locale = useLocale('Input');

    const uid = $props.id();

    const prefixCls = cssClasses.PREFIX;
    const labelId = $derived(label?.id ?? `${uid}-label`);
    const hasLabel = $derived(Boolean(fieldLabel) || (label?.text !== undefined && label.text !== ''));

    // size stays unset when neither the group nor the global defaults give one, so a control falls back to its own default
    setInputGroupContext({
        get size() {
            return size;
        },
        get disabled() {
            return disabled;
        },
        layer: getPopupLayerContext(),
    });
</script>

{#snippet group()}
    <!-- a shown label names the group; the span is not labelable, so the label's `for` would point nowhere. rest comes after the built-in attributes so the consumer's role, aria-label and id win -->
    <span
        aria-label={hasLabel ? undefined : locale().locale.group}
        aria-labelledby={hasLabel ? labelId : undefined}
        id={hasLabel ? label?.name || `${uid}-group` : undefined}
        role="group"
        {...rest}
        class={[`${prefixCls}-group`, rest.class, { [`${prefixCls}-${size}`]: size !== undefined && size !== 'default' }]}
        onfocusin={onFocus}
        onfocusout={onBlur}
    >
        {@render children?.()}
    </span>
{/snippet}

{#if hasLabel}
    <div class={[`${prefixCls}-group-wrapper`, { [`${prefixCls}-group-wrapper-with-top-label`]: labelPosition === 'top', [`${prefixCls}-group-wrapper-with-left-label`]: labelPosition === 'left' }]}>
        <FormLabel {...label} children={fieldLabel} extra={labelExtra} id={labelId} name={undefined} />
        {@render group()}
    </div>
{:else}
    {@render group()}
{/if}
