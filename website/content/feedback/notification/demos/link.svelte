<script lang="ts">
    import { Button, Notification, TypographyText } from '@fibrae/semi-ui-svelte';
</script>

{#snippet content()}
    <div>Hi, Bytedance dance dance</div>
    <div style="margin-top: 8px">
        <TypographyText link>查看详情</TypographyText>
        <TypographyText link style="margin-left: 20px">一会再看</TypographyText>
    </div>
{/snippet}

<Button onclick={() => Notification.info({ title: 'This is a title', content, duration: 3 })}>Display Notification</Button>
