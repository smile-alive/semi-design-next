<script lang="ts">
    import { Card, CardGroup, Slider, Typography } from '@fibrae/semi-ui-svelte';

    const cardIndexes = Array.from({ length: 8 }, (_, index) => index);

    let spacing = $state(12);

    const onSpacingChange = (value: number | number[]) => {
        if (typeof value === 'number') spacing = value;
    };
</script>

<Typography.Text id="card-group-spacing">滑动调节 Card 间距</Typography.Text>
<Slider aria-labelledby="card-group-spacing" max={40} min={10} onChange={onSpacingChange} style="width: 360px" value={12} />
<br />
<CardGroup {spacing}>
    {#each cardIndexes as idx (idx)}
        <Card headerLine={false} shadows="hover" style="width: 260px" title="Card title">
            {#snippet headerExtraContent()}
                <Typography.Text link>More</Typography.Text>
            {/snippet}
            <Typography.Text>Card content</Typography.Text>
        </Card>
    {/each}
</CardGroup>
