<script lang="ts">
    import { IconLoading } from '@fibrae/semi-icons-svelte';
    import { Spin } from '@fibrae/semi-ui-svelte';
</script>

<div style="margin-left: 30px">
    <div>自定义指示符的加载器</div>
    <Spin>
        {#snippet indicator()}
            <IconLoading />
        {/snippet}
    </Spin>
</div>
