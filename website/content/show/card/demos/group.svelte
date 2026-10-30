<script lang="ts">
    import { Card, CardGroup, Slider, TypographyText } from '@fibrae/semi-ui-svelte';

    let spacing = $state(12);
    const items = [1, 2, 3, 4, 5, 6, 7, 8];

    const onSpacingChange = (value: number | number[]) => {
        if (typeof value === 'number') spacing = value;
    };
</script>

<TypographyText id="card-group-spacing">滑动调节 Card 间距</TypographyText>
<Slider aria-labelledby="card-group-spacing" max={40} min={10} onChange={onSpacingChange} style="width: 360px" value={12} />
<br />
<CardGroup {spacing}>
    {#each items as idx (idx)}
        <Card headerLine={false} shadows="hover" style="width: 260px" title="Card title">
            {#snippet headerExtraContent()}
                <TypographyText link>More</TypographyText>
            {/snippet}
            <TypographyText>Card content</TypographyText>
        </Card>
    {/each}
</CardGroup>
