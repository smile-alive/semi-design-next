<script lang="ts">
    import { Card, Typography } from '@fibrae/semi-ui-svelte';
</script>

<Card title="Card title">
    <Card style="margin-bottom: 20px" title="Inner Card title">
        {#snippet headerExtraContent()}
            <Typography.Text link>More</Typography.Text>
        {/snippet}
        Inner Card content
    </Card>
    <Card title="Inner Card title">
        {#snippet headerExtraContent()}
            <Typography.Text link>More</Typography.Text>
        {/snippet}
        Inner Card content
    </Card>
</Card>
