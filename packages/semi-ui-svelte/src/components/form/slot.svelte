<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { getFieldIds } from '@fibrae/semi-foundation/components/form/utils';
    import { joinIds, namedRole } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import { getFormContext } from './context.js';
    import ErrorMessage from './error-message.svelte';
    import FieldGrid from './field-grid.svelte';
    import type { AllFormProps, SlotProps } from './interface.js';
    import Label from './label.svelte';
    import { isLabelConfig } from './utils.js';

    let { label, labelPosition, noLabel, error, children, fieldLabel, labelExtra, errorContent, ...rest }: SlotProps = $props();

    const form = getFormContext();

    const uid = $props.id();

    const prefix = cssClasses.PREFIX;
    const formProps = $derived<AllFormProps>(form?.formProps ?? {});
    const shownLabelPosition = $derived(labelPosition || formProps.labelPosition || 'top');
    const labelConfig = $derived(isLabelConfig(label) ? label : { text: label });
    const labelId = $derived((isLabelConfig(label) && label.id) || getFieldIds(uid).label);

    // a rendered label names the slot, so the slot becomes a group its content belongs to
    const labelShown = $derived(!noLabel && ((labelConfig.text != null && labelConfig.text !== '') || Boolean(fieldLabel)));
    const labelledby = $derived(joinIds(rest['aria-labelledby'] ?? undefined, labelShown && labelId));
</script>

{#snippet labelView()}
    {#if !noLabel}
        <Label align={formProps.labelAlign} width={formProps.labelWidth} {...labelConfig} children={fieldLabel} extra={labelExtra} id={labelShown ? labelId : undefined} />
    {/if}
{/snippet}

<div {...rest} aria-labelledby={labelledby} class={[`${prefix}-field`, `${prefix}-slot`, rest.class]} role={namedRole({ ...rest, 'aria-labelledby': labelledby }) as 'group' | undefined} {...{ 'x-label-pos': shownLabelPosition }}>
    <FieldGrid label={labelView} labelAlign={formProps.labelAlign} labelCol={formProps.labelCol} labelPosition={shownLabelPosition} mainClass={[`${prefix}-field-main`, `${prefix}-slot-main`]} wrapperCol={formProps.wrapperCol}>
        {@render children?.()}
        {#if error !== undefined}
            <ErrorMessage {error} {errorContent} />
        {/if}
    </FieldGrid>
</div>
