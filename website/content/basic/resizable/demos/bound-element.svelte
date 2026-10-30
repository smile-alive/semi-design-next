<script lang="ts">
    import { Resizable } from '@fibrae/semi-ui-svelte';
</script>

<div style="width: 300px; height: 300px; border: var(--semi-color-border) 1px solid">
    <Resizable boundElement="parent" defaultSize={{ width: '60%', height: 200 }} style="margin-left: 20%; background-color: var(--semi-grey-1)">
        <div style="margin-left: 20%">bound：parent</div>
    </Resizable>
</div>
