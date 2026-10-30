<script lang="ts">
    import { Button, Popconfirm, Space } from '@fibrae/semi-ui-svelte';
</script>

{#snippet text()}此修改将不可逆{/snippet}

<Space>
    <Popconfirm content={text} okButtonProps={{ autoFocus: true, type: 'danger' }} title="确定是否要保存此修改？">
        <Button>确认聚焦</Button>
    </Popconfirm>
    <Popconfirm cancelButtonProps={{ autoFocus: true }} content={text} title="确定是否要保存此修改？">
        <Button>取消聚焦</Button>
    </Popconfirm>
    <Popconfirm title="确定是否要保存此修改？">
        <Button>内容聚焦</Button>
        {#snippet content({ initialFocusRef })}
            <input {@attach initialFocusRef} placeholder="focus here" />
        {/snippet}
    </Popconfirm>
</Space>
