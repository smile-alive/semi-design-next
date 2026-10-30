<script lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-svelte';
    import ShowFieldState from './parts/show-field-state.svelte';
</script>

<Form layout="horizontal">
    <div style="width: 400px">
        <FormInput field="name" initValue="mike" />
        <FormInput field="country" initValue="china" />
    </div>
    <div style="width: 500px; margin-top: 30px">
        <ShowFieldState field="name" />
        <ShowFieldState field="country" />
    </div>
</Form>
