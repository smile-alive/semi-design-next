<script lang="ts">
    import { Resizable } from '@fibrae/semi-ui-svelte';
</script>

<div style="width: 500px; height: 60%">
    <Resizable defaultSize={{ width: 400, height: 300 }} lockAspectRatio style="background-color: var(--semi-grey-1); margin-bottom: 10px">
        <div style="margin-left: 20%">lock</div>
    </Resizable>
    <Resizable defaultSize={{ width: 200, height: (200 * 9) / 16 }} lockAspectRatio={16 / 9} style="background-color: var(--semi-grey-1)">
        <div style="margin-left: 20%">16 / 9</div>
    </Resizable>
</div>
