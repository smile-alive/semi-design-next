<script lang="ts">
    import Button from '../../button/button.svelte';
    import Modal from '../modal.svelte';

    let { mask = true, motion = false }: { mask?: boolean; motion?: boolean } = $props();

    let visible = $state(false);
</script>

<Button onclick={() => (visible = true)}>Open</Button>
<Button>Page</Button>
<Modal bind:visible {mask} {motion} title="Dialog">
    <Button>Inside</Button>
    <input aria-label="name" />
</Modal>
<output aria-label="visible">{visible}</output>
