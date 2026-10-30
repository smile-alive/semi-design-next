<script lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-svelte';
    import ShowFormState from './parts/show-form-state.svelte';
</script>

<Form>
    <FormInput field="name" initValue="mike" />
    <h5>FormState read by 【useFormState】：</h5>
    <ShowFormState />
</Form>
