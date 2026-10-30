<script lang="ts" module>
    import type { Component } from 'svelte';
    import FormField from '../field.svelte';
    import FormAutoComplete from '../form-auto-complete.svelte';
    import FormCascader from '../form-cascader.svelte';
    import FormCheckboxGroup from '../form-checkbox-group.svelte';
    import FormCheckbox from '../form-checkbox.svelte';
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
    import FormTreeSelect from '../form-tree-select.svelte';
    import FormUpload from '../form-upload.svelte';
    import ArrayRows from './array-rows.svelte';
    import StateProbe from './state-probe.svelte';

    export const fieldComponents = {
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
        upload: FormUpload,
        field: FormField,
        stateProbe: StateProbe,
        arrayRows: ArrayRows,
    } as unknown as Record<string, Component<Record<string, unknown>>>;

    export interface FieldSpec {
        type: keyof typeof fieldComponents;
        props: Record<string, unknown>;
        /** Rendered only while true */
        shown?: boolean;
    }

    export interface FormFixtureStore {
        form: Record<string, unknown>;
        fields: FieldSpec[];
        showState?: boolean;
        submitButton?: boolean;
        /** One row of FormInputs per item of `values[path]`, with a field per sub key */
        rows?: { path: string; subs: string[]; keyBy?: string };
    }
</script>

<script lang="ts">
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';

    let { store, onApi }: { store: FormFixtureStore; onApi?: (api: FormApi) => void } = $props();
</script>

<Form {...store.form} getFormApi={onApi}>
    {#snippet children({ formState, values, formApi })}
        {#each store.fields as spec, index (index)}
            {@const Field = fieldComponents[spec.type]}
            {#if spec.shown ?? true}
                <Field {...spec.props} />
            {/if}
        {/each}
        {#if store.showState}
            <code data-testid="state">{JSON.stringify(formState)}</code>
            <output data-testid="values">{JSON.stringify(values)}</output>
            <output data-testid="scope-api">{JSON.stringify(formApi.getValues())}</output>
        {/if}
        {#if store.rows}
            {@const rows = store.rows}
            {#each (values[rows.path] as Record<string, unknown>[] | undefined) ?? [] as item, i (rows.keyBy ? item[rows.keyBy] : i)}
                <div>
                    {#each rows.subs as sub (sub)}
                        <FormInput field={`${rows.path}[${i}].${sub}`} />
                    {/each}
                </div>
            {/each}
        {/if}
        {#if store.submitButton}
            <button type="submit">submit</button>
        {/if}
    {/snippet}
</Form>
