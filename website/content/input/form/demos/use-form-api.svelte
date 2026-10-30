<script lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-svelte';
    import ChangeNameByFormApi from './parts/change-name-by-form-api.svelte';
</script>

<Form>
    <FormInput field="name" initValue="mike" />
    <ChangeNameByFormApi />
</Form>
