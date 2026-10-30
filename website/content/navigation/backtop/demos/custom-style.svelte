<script lang="ts">
    import { IconArrowUp } from '@fibrae/semi-icons-svelte';
    import { BackTop } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <span>向下滚动，右下角会出现一个方形的多彩按钮。</span>
    <BackTop aria-label="回到顶部" colorful shape="square" size="large" style="bottom: 100px">
        {#snippet icon()}
            <IconArrowUp />
        {/snippet}
    </BackTop>
</div>
