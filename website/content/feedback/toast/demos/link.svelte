<script lang="ts">
    import { Button, Toast, Typography } from '@fibrae/semi-ui-svelte';
</script>

{#snippet single()}
    <span>
        <Typography.Text>Hi, Bytedance dance dance</Typography.Text>
        <Typography.Text link style="margin-inline-start: 12px">更多</Typography.Text>
    </span>
{/snippet}
{#snippet multiLine()}
    <div>Hi, Bytedance dance dance</div>
    <div style="margin-block-start: 8px">
        <Typography.Text link>查看详情</Typography.Text>
        <Typography.Text link style="margin-inline-start: 20px">一会再看</Typography.Text>
    </div>
{/snippet}

<Button onclick={() => Toast.info({ content: single, duration: 3 })}>Display Toast</Button>
<br />
<br />
<Button onclick={() => Toast.info({ content: multiLine, duration: 3 })}>Display Multi-line Toast</Button>
