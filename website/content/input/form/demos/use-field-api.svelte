<script lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-svelte';
    import ChangeNameByFieldApi from './parts/change-name-by-field-api.svelte';
</script>

<Form>
    <FormInput field="name" initValue="mike" />
    <ChangeNameByFieldApi />
</Form>
