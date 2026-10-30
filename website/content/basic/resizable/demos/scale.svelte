<script lang="ts">
    import { Resizable } from '@fibrae/semi-ui-svelte';
</script>

<div style="width: 500px; height: 60%; transform: scale(0.5); transform-origin: 0 0">
    <Resizable defaultSize={{ width: '60%', height: '60%' }} scale={0.5} style="background-color: var(--semi-grey-1)">
        <div style="margin-left: 20%">scale 0.5</div>
    </Resizable>
</div>
