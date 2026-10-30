<script lang="ts">
    import { Card, TypographyText } from '@fibrae/semi-ui-svelte';
</script>

<Card title="Card title">
    <Card style="margin-bottom: 20px" title="Inner Card title">
        {#snippet headerExtraContent()}
            <TypographyText link>More</TypographyText>
        {/snippet}
        Inner Card content
    </Card>
    <Card title="Inner Card title">
        {#snippet headerExtraContent()}
            <TypographyText link>More</TypographyText>
        {/snippet}
        Inner Card content
    </Card>
</Card>
