<script lang="ts">
    import { HotKeys } from '..';

    let { mode }: { mode: 'basic' | 'combo' | 'target' } = $props();
    let count = $state(0);
    const onHotKey = () => {
        count++;
    };
    const getTarget = () => document.getElementById('test');
</script>

<div>
    {#if mode === 'basic'}
        <HotKeys content={['Control', 'K']} hotKeys={[HotKeys.Keys.Control, 'k']} {onHotKey} />
    {:else if mode === 'combo'}
        <HotKeys hotKeys={[HotKeys.Keys.Meta, HotKeys.Keys.Alt, 'k']} {onHotKey} />
        <HotKeys hotKeys={['Meta', 'Shift', 'k']} {onHotKey} />
    {:else}
        <input id="test" placeholder="test for target" />
        <HotKeys getListenerTarget={getTarget} hotKeys={['Meta', HotKeys.Keys.S]} {onHotKey} />
    {/if}
    <pre data-testid="pre">{count}</pre>
</div>
