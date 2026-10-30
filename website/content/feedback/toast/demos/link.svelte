<script lang="ts">
    import { Button, Toast, TypographyText } from '@fibrae/semi-ui-svelte';
</script>

{#snippet single()}
    <span>
        <TypographyText>Hi, Bytedance dance dance</TypographyText>
        <TypographyText link style="margin-left: 12px">更多</TypographyText>
    </span>
{/snippet}
{#snippet multiLine()}
    <div>Hi, Bytedance dance dance</div>
    <div style="margin-top: 8px">
        <TypographyText link>查看详情</TypographyText>
        <TypographyText link style="margin-left: 20px">一会再看</TypographyText>
    </div>
{/snippet}

<Button onclick={() => Toast.info({ content: single, duration: 3 })}>Display Toast</Button>
<br />
<br />
<Button onclick={() => Toast.info({ content: multiLine, duration: 3 })}>Display Multi-line Toast</Button>
