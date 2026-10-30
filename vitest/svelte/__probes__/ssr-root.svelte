<script lang="ts">
    import IdProbe from './id-probe.svelte';
    import TabPane from './tab-pane.svelte';
    import Tabs from './tabs.svelte';
</script>

<div data-case="id"><IdProbe /><IdProbe /></div>
<div data-case="tabs">
    <Tabs>
        <TabPane title="one" />
        <TabPane title="two" />
    </Tabs>
</div>
