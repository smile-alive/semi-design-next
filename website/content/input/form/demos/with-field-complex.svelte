<script lang="ts">
    import { Form, FormField } from '@fibrae/semi-ui-svelte';
    import BaseInfo from './parts/base-info.svelte';
</script>

<Form>
    {#snippet children({ formState })}
        <FormField component={BaseInfo} field="baseInfo" label={{ text: '基本信息', required: true }} />
        <pre><code>{JSON.stringify(formState)}</code></pre>
    {/snippet}
</Form>
