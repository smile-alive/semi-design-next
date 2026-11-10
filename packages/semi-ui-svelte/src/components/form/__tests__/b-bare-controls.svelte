<script lang="ts">
    import FormCheckboxGroup from '../fields/form-checkbox-group.svelte';
    import FormCheckbox from '../fields/form-checkbox.svelte';
    import FormRadioGroup from '../fields/form-radio-group.svelte';
    import FormRadio from '../fields/form-radio.svelte';
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';

    let { onApi }: { onApi?: (api: FormApi) => void } = $props();
</script>

<Form getFormApi={onApi}>
    <FormCheckboxGroup field="group">
        <FormCheckbox class="own" data-testid="a" id="own-checkbox" value="a">A</FormCheckbox>
    </FormCheckboxGroup>
    <FormRadioGroup field="pick">
        <FormRadio id="own-radio" value="r">R</FormRadio>
    </FormRadioGroup>
</Form>
