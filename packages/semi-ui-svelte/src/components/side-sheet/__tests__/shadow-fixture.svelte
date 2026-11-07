<script lang="ts">
    import Button from '../../button/button.svelte';
    import SideSheet from '../side-sheet.svelte';

    let { mount }: { mount: HTMLElement } = $props();

    let visible = $state(false);
</script>

<Button onclick={() => (visible = true)}>Open</Button>
<SideSheet bind:visible closeOnEsc getPopupContainer={() => mount} mask={false} motion={false} title="Sheet">
    <Button>Inside</Button>
</SideSheet>
