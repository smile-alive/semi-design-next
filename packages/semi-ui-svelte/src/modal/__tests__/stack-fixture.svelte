<script lang="ts">
    import Button from '../../button/button.svelte';
    import Modal from '../modal.svelte';

    let outer = $state(false);
    let inner = $state(false);
</script>

<Button onclick={() => (outer = true)}>Open outer</Button>
<Modal bind:visible={outer} motion={false} title="Outer">
    <Button onclick={() => (inner = true)}>Open inner</Button>
</Modal>
<Modal bind:visible={inner} motion={false} title="Inner" />
<output aria-label="outer">{outer}</output>
<output aria-label="inner">{inner}</output>
