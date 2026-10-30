<script lang="ts">
    import { Button, Popconfirm } from '@fibrae/semi-ui-svelte';

    const onConfirm = () =>
        new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log('resolve,close popconfirm');
                resolve();
            }, 2000);
        });

    const onCancel = () =>
        new Promise<void>((_resolve, reject) => {
            setTimeout(() => {
                console.log('reject, popconfirm still exist');
                reject();
            }, 2000);
        });
</script>

<Popconfirm {onCancel} {onConfirm} title="确定是否要保存此修改？">
    <Button>保存</Button>
    {#snippet content()}此修改将不可逆{/snippet}
</Popconfirm>
