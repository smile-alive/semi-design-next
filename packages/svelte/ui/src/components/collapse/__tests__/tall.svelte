<script lang="ts">
    import Collapse from '../collapse.svelte';
    import CollapsePanel from '../panel.svelte';

    let activeKey = $state<string[]>(['1']);
</script>

<Collapse bind:activeKey>
    <CollapsePanel itemKey="1">
        {#snippet header()}panel{/snippet}
        <div style:height="400px">tall content</div>
    </CollapsePanel>
</Collapse>
