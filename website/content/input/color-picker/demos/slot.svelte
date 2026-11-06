<script lang="ts">
    import { ColorPicker } from '@fibrae/semi-ui-svelte';
</script>

<ColorPicker alpha onChange={(value) => console.log(value)}>
    {#snippet topSlot()}
        <div>TopSlot</div>
    {/snippet}
    {#snippet bottomSlot()}
        <div>Bottom Slot</div>
    {/snippet}
</ColorPicker>
