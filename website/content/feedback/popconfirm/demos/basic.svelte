<script lang="ts">
    import { Button, Popconfirm, Toast } from '@fibrae/semi-ui-svelte';

    const onConfirm = () => {
        Toast.success('确认保存！');
    };

    const onCancel = () => {
        Toast.warning('取消保存！');
    };
</script>

<Popconfirm {onCancel} {onConfirm} title="确定是否要保存此修改？">
    <Button>保存</Button>
    {#snippet content()}此修改将不可逆{/snippet}
</Popconfirm>
