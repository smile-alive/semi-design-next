<script lang="ts">
    import { IconDelete } from '@fibrae/semi-icons-svelte';
    import { Button } from '@fibrae/semi-ui-svelte';

    let saveLoading = $state(false);
    let delLoading = $state(true);
    let repLoading = $state(true);

    const reset = (status: boolean) => {
        saveLoading = status;
        delLoading = status;
        repLoading = status;
    };
</script>

<div>
    <div>
        <div class="btn-margin-right" style="display: inline-flex; align-items: center; padding-bottom: 14px">
            <Button onclick={() => reset(false)}>关闭加载态</Button>
            <Button onclick={() => reset(true)}>开启加载态</Button>
        </div>
    </div>
    <hr />
    <Button loading={saveLoading} style="margin-right: 14px" onclick={() => (saveLoading = true)}>保存</Button>
    <Button loading={delLoading} style="margin-right: 14px" type="danger" onclick={() => (delLoading = true)}>
        {#snippet icon()}
            <IconDelete />
        {/snippet}
        删除
    </Button>
    <div style="width: 200px; display: inline-block">
        <Button block loading={repLoading} theme="solid" type="warning" onclick={() => (repLoading = true)}>撤销</Button>
    </div>
</div>
