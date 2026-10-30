<script lang="ts">
    import FormCheckboxGroup from '../form-checkbox-group.svelte';
    import FormCheckbox from '../form-checkbox.svelte';
    import FormRadioGroup from '../form-radio-group.svelte';
    import FormRadio from '../form-radio.svelte';
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';

    let { onApi }: { onApi?: (api: FormApi) => void } = $props();
</script>

<!-- FormCheckbox and FormRadio without `field`: the bare controls, as the groups use them -->
<Form getFormApi={onApi}>
    <FormCheckboxGroup field="group">
        <FormCheckbox class="own" data-testid="a" id="own-checkbox" value="a">A</FormCheckbox>
    </FormCheckboxGroup>
    <FormRadioGroup field="pick">
        <FormRadio id="own-radio" name="own-name" value="r">R</FormRadio>
    </FormRadioGroup>
</Form>
