<script lang="ts">
    import { Form, FormField } from '@fibrae/semi-ui-svelte';
    import BaseInfo from './parts/base-info.svelte';
    import ShowFormState from './parts/show-form-state.svelte';
</script>

<Form>
    <FormField component={BaseInfo} field="baseInfo" label={{ text: '基本信息', required: true }} />
    <ShowFormState />
</Form>
