<script lang="ts">
    import { Form, FormSelect } from '@fibrae/semi-ui-svelte';

    const roleOptions = [
        { label: '管理员', value: 'admin' },
        { label: '访客', value: 'guest' },
    ];
</script>

<Form initValues={{ keep: 'admin', drop: 'admin' }}>
    {#snippet children({ values })}
        <FormSelect allowEmpty field="keep" label="设置了 allowEmpty" optionList={roleOptions} showClear style="width: 176px" />
        <FormSelect field="drop" label="未设置" optionList={roleOptions} showClear style="width: 176px" />
        <code>{JSON.stringify(Object.keys(values))}</code>
    {/snippet}
</Form>
