<script lang="ts" module>
    import type { Component } from 'svelte';
    import FormAutoComplete from '../form-auto-complete.svelte';
    import FormCascader from '../form-cascader.svelte';
    import FormCheckboxGroup from '../form-checkbox-group.svelte';
    import FormCheckbox from '../form-checkbox.svelte';
    import FormDatePicker from '../form-date-picker.svelte';
    import FormInputNumber from '../form-input-number.svelte';
    import FormInput from '../form-input.svelte';
    import FormPinCode from '../form-pin-code.svelte';
    import FormRadioGroup from '../form-radio-group.svelte';
    import FormRadio from '../form-radio.svelte';
    import FormRating from '../form-rating.svelte';
    import FormSelect from '../form-select.svelte';
    import FormSlider from '../form-slider.svelte';
    import FormSwitch from '../form-switch.svelte';
    import FormTagInput from '../form-tag-input.svelte';
    import FormTextArea from '../form-text-area.svelte';
    import FormTimePicker from '../form-time-picker.svelte';
    import FormTransfer from '../form-transfer.svelte';
    import FormTreeSelect from '../form-tree-select.svelte';
    import FormUpload from '../form-upload.svelte';

    // every field the package exports, so a test picks one by name
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
        /** Rendered only while true */
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
