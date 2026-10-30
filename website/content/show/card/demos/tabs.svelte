<script lang="ts">
    import { Card, Tabs } from '@fibrae/semi-ui-svelte';

    const tabList = [
        { itemKey: '1', tab: 'Tab 1' },
        { itemKey: '2', tab: 'Tab 2' },
    ];
</script>

<Card title="Card title">
    <Tabs style="margin-top: -20px; margin-bottom: -20px" {tabList} type="line">
        {#snippet panel({ itemKey })}
            <p>content{itemKey}</p>
            <p>content{itemKey}</p>
            <p>content{itemKey}</p>
        {/snippet}
    </Tabs>
</Card>
