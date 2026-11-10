<script lang="ts">
    import { untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { isErrorLeaf } from '@fibrae/semi-foundation/components/form/errors';
    import { getFieldIds } from '@fibrae/semi-foundation/components/form/utils';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import { type SlotKind, trackSlotKind } from '../../utils/slot-kind.js';
    // aliased: the generated declaration names this component `InputGroup` after its file
    import BaseInputGroup from '../input/input-group.svelte';
    import { getFormContext, setFormInputGroupContext } from './context.js';
    import ErrorMessage from './error-message.svelte';
    import FieldGrid from './field-grid.svelte';
    import type { AllFormProps, InputGroupProps } from './interface.js';
    import { isLabelConfig } from './utils.js';

    let { label, labelPosition, extraTextPosition = 'bottom', disabled, 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby, 'aria-errormessage': _ariaErrormessage, fieldLabel, labelExtra, extraText, children, ...rest }: InputGroupProps = $props();

    const form = getFormContext();

    const uid = $props.id();

    // a field registers once per mount, so a set keeps the fields in mount order
    const fields = new SvelteSet<string>();
    let extraKind = $state<SlotKind>();

    const prefix = cssClasses.PREFIX;
    const ids = getFieldIds(uid);
    const formProps = $derived<AllFormProps>(form?.formProps ?? {});
    const shownLabelPosition = $derived(labelPosition || formProps.labelPosition);
    const labelConfig = $derived(isLabelConfig(label) ? label : { text: label });
    const labelId = $derived((isLabelConfig(label) ? label.id : undefined) ?? ids.label);
    const hasLabel = $derived(Boolean(label) || Boolean(fieldLabel));

    const groupError = $derived(
        [...fields].flatMap((path) => {
            const error: unknown = ObjectUtil.get(form?.formState.errors ?? {}, path);
            return isErrorLeaf(error) ? error : [];
        })
    );

    setFormInputGroupContext({
        registerField: (path) => {
            fields.add(path);
            return () => fields.delete(path);
        },
        // the group's own aria-labelledby and aria-describedby are added to each field's references rather than set on the group
        get aria() {
            return {
                labelledby: joinIds(ariaLabelledby ?? undefined, hasLabel && labelId),
                describedby: joinIds(ariaDescribedby ?? undefined, Boolean(extraText) && ids.extraText),
                errormessage: ids.errorMessage,
            };
        },
    });

    untrack(() => warning(!form, '[Semi Form]: FormInputGroup must be used inside the Form, please check your dom declaration'));
</script>

{#snippet extraView()}
    <div
        {@attach trackSlotKind((kind) => (extraKind = kind))}
        class={[
            `${prefix}-field-extra`,
            {
                [`${prefix}-field-extra-string`]: extraKind === 'text',
                [`${prefix}-field-extra-middle`]: extraTextPosition === 'middle',
                [`${prefix}-field-extra-bottom`]: extraTextPosition === 'bottom',
            },
        ]}
        id={ids.extraText}
        x-semi-prop="extraText"
    >
        {@render extraText?.()}
    </div>
{/snippet}

{#if form}
    <div class={`${prefix}-field-group`} {...{ 'x-label-pos': shownLabelPosition }}>
        <!-- the base InputGroup renders the label, so its span is the one group the label names. shortcut: under
             labelCol and wrapperCol the label sits in the wrapper column, not the label column; upgrade when
             InputGroup can be named by a label rendered outside it -->
        <FieldGrid labelAlign={formProps.labelAlign} labelCol={formProps.labelCol} labelPosition={shownLabelPosition} wrapperCol={formProps.wrapperCol}>
            {#if extraText && extraTextPosition === 'middle'}
                {@render extraView()}
            {/if}
            <BaseInputGroup {...rest} disabled={disabled ?? formProps.disabled} {fieldLabel} label={hasLabel ? { width: formProps.labelWidth, align: formProps.labelAlign, ...labelConfig, id: labelId } : undefined} {labelExtra} labelPosition={shownLabelPosition === 'left' ? 'left' : 'top'}>
                {@render children?.()}
            </BaseInputGroup>
            {#if extraText && extraTextPosition === 'bottom'}
                {@render extraView()}
            {/if}
            {#if groupError.length}
                <ErrorMessage error={groupError} errorMessageId={ids.errorMessage} isInInputGroup showValidateIcon={formProps.showValidateIcon} />
            {/if}
        </FieldGrid>
    </div>
{/if}
