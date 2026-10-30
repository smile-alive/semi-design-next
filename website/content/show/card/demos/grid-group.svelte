<script lang="ts">
    import { Card, CardGroup, TypographyText } from '@fibrae/semi-ui-svelte';

    const items = [1, 2, 3, 4, 5, 6, 7];
</script>

<CardGroup type="grid">
    {#each items as idx (idx)}
        <Card headerLine={false} shadows="hover" style="width: 260px" title="Card title">
            {#snippet headerExtraContent()}
                <TypographyText link>More</TypographyText>
            {/snippet}
            <TypographyText>Card content</TypographyText>
        </Card>
    {/each}
</CardGroup>
