<script lang="ts">
    import { Form } from '../index.js';
    import type { FormApi } from '../interface.js';

    let { onApi }: { onApi?: (api: FormApi) => void } = $props();
</script>

<Form getFormApi={onApi}>
    <Form.Section>
        {#snippet text()}Account{/snippet}
        <Form.Input field="name" initValue="semi" label="Name" />
        <Form.Transfer dataSource={[{ label: 'A', value: 'a', key: 'a' }]} field="members" initValue={['a']} label="Members" />
    </Form.Section>
</Form>
