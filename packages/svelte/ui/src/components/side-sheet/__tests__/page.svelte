<script lang="ts">
    import Button from '../../button/button.svelte';
    import SideSheet from '../side-sheet.svelte';

    let { mask = true, motion = false }: { mask?: boolean; motion?: boolean } = $props();

    let visible = $state(false);
</script>

<Button onclick={() => (visible = true)}>Open</Button>
<Button>Page</Button>
<SideSheet bind:visible closeOnEsc {mask} {motion} title="Sheet">
    <Button>Inside</Button>
</SideSheet>
<output aria-label="visible">{visible}</output>
