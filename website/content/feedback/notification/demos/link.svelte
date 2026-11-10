<script lang="ts">
    import { Button, Notification, Typography } from '@fibrae/semi-ui-svelte';
</script>

{#snippet content()}
    <div>Hi, Semi dance dance</div>
    <div style="margin-block-start: 8px">
        <Typography.Text link>查看详情</Typography.Text>
        <Typography.Text link style="margin-inline-start: 20px">一会再看</Typography.Text>
    </div>
{/snippet}

<Button onclick={() => Notification.info({ title: 'This is a title', content, duration: 3 })}>Display Notification</Button>
