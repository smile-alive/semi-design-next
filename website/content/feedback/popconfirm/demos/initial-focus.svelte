<script lang="ts">
    import { Button, Popconfirm, Space } from '@fibrae/semi-ui-svelte';
</script>

<Space>
    <Popconfirm okButtonProps={{ autoFocus: true, type: 'danger' }} title="确定是否要保存此修改？">
        <Button>确认聚焦</Button>
        {#snippet content()}此修改将不可逆{/snippet}
    </Popconfirm>
    <Popconfirm cancelButtonProps={{ autoFocus: true }} title="确定是否要保存此修改？">
        <Button>取消聚焦</Button>
        {#snippet content()}此修改将不可逆{/snippet}
    </Popconfirm>
    <Popconfirm title="确定是否要保存此修改？">
        <Button>内容聚焦</Button>
        {#snippet content(focus)}
            <input {@attach focus.initialFocusRef} placeholder="focus here" />
        {/snippet}
    </Popconfirm>
</Space>
