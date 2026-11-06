<script lang="ts">
    import { Form, FormField, type WithFieldOption } from '@fibrae/semi-ui-svelte';
    import HtmlInput from './parts/html-input.svelte';
    import ShowFormState from './parts/show-form-state.svelte';

    const fieldOptions: WithFieldOption = {
        valueKey: 'value',
        onKeyChangeFnName: 'oninput',
        onBlurFnName: 'onblur',
        valuePath: 'target.value',
        validateStatus: false,
    };
</script>

<Form>
    <FormField component={HtmlInput} field="name" {fieldOptions} />
    <ShowFormState />
</Form>
