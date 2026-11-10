<script lang="ts" module>
    import type { Component } from 'svelte';
    import FormAutoComplete from '../fields/form-auto-complete.svelte';
    import FormCascader from '../fields/form-cascader.svelte';
    import FormCheckboxGroup from '../fields/form-checkbox-group.svelte';
    import FormCheckbox from '../fields/form-checkbox.svelte';
    import FormDatePicker from '../fields/form-date-picker.svelte';
    import FormInputNumber from '../fields/form-input-number.svelte';
    import FormInput from '../fields/form-input.svelte';
    import FormPinCode from '../fields/form-pin-code.svelte';
    import FormRadioGroup from '../fields/form-radio-group.svelte';
    import FormRadio from '../fields/form-radio.svelte';
    import FormRating from '../fields/form-rating.svelte';
    import FormSelect from '../fields/form-select.svelte';
    import FormSlider from '../fields/form-slider.svelte';
    import FormSwitch from '../fields/form-switch.svelte';
    import FormTagInput from '../fields/form-tag-input.svelte';
    import FormTextArea from '../fields/form-text-area.svelte';
    import FormTimePicker from '../fields/form-time-picker.svelte';
    import FormTransfer from '../fields/form-transfer.svelte';
    import FormTreeSelect from '../fields/form-tree-select.svelte';
    import FormUpload from '../fields/form-upload.svelte';

    export const allFieldComponents = {
        input: FormInput,
        textArea: FormTextArea,
        inputNumber: FormInputNumber,
        select: FormSelect,
        checkbox: FormCheckbox,
        checkboxGroup: FormCheckboxGroup,
        radio: FormRadio,
        radioGroup: FormRadioGroup,
        switch: FormSwitch,
        slider: FormSlider,
        rating: FormRating,
        tagInput: FormTagInput,
        autoComplete: FormAutoComplete,
        timePicker: FormTimePicker,
        pinCode: FormPinCode,
        cascader: FormCascader,
        treeSelect: FormTreeSelect,
        transfer: FormTransfer,
        datePicker: FormDatePicker,
        upload: FormUpload,
    } as unknown as Record<string, Component<Record<string, unknown>>>;

    export interface AnyFieldSpec {
        type: keyof typeof allFieldComponents;
        props: Record<string, unknown>;
        shown?: boolean;
    }

    export interface AnyFieldsStore {
        form: Record<string, unknown>;
        fields: AnyFieldSpec[];
    }
</script>

<script lang="ts">
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';

    let { store, onApi }: { store: AnyFieldsStore; onApi?: (api: FormApi) => void } = $props();
</script>

<Form {...store.form} getFormApi={onApi}>
    {#each store.fields as spec, index (index)}
        {@const Field = allFieldComponents[spec.type]}
        {#if spec.shown ?? true}
            <Field {...spec.props} />
        {/if}
    {/each}
</Form>
