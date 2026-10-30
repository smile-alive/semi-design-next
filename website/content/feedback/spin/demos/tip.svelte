<script lang="ts">
    import { Spin } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Spin>
        {#snippet tip()}加载中...{/snippet}
        <div style="border: 1px solid var(--semi-color-primary); border-radius: 4px; padding-left: 8px">
            <p>这里是一些文字。</p>
            <p>还有更多文字正在路上。</p>
        </div>
    </Spin>
</div>
