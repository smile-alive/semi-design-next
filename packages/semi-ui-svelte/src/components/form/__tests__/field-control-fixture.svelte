<script lang="ts">
    import FormInput from '../fields/form-input.svelte';
    import FormSelect from '../fields/form-select.svelte';
    import Form from '../form.svelte';

    export const getInput = () => input;
    export const getSelect = () => select;

    let input: FormInput | undefined;
    let select: FormSelect | undefined;
</script>

<Form>
    <FormInput bind:this={input} field="name" />
    <FormSelect bind:this={select} field="kind" optionList={[{ label: '甲', value: 'a' }]} />
</Form>
