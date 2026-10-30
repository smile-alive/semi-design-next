<script lang="ts">
    import { Resizable } from '@fibrae/semi-ui-svelte';
</script>

<div style="width: 500px; height: 60%">
    <Resizable defaultSize={{ width: '60%', height: 300 }} grid={[100, 100]} snapGap={20} style="margin-left: 20%; background-color: var(--semi-grey-1); border: var(--semi-color-border) 1px solid">
        <div style="margin-left: 20%">snap</div>
    </Resizable>
</div>
