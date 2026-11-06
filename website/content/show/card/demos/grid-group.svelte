<script lang="ts">
    import { Card, CardGroup, Typography } from '@fibrae/semi-ui-svelte';

    const cardIndexes = Array.from({ length: 7 }, (_, index) => index);
</script>

<CardGroup type="grid">
    {#each cardIndexes as idx (idx)}
        <Card headerLine={false} shadows="hover" style="width: 260px" title="Card title">
            {#snippet headerExtraContent()}
                <Typography.Text link>More</Typography.Text>
            {/snippet}
            <Typography.Text>Card content</Typography.Text>
        </Card>
    {/each}
</CardGroup>
