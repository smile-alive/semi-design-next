<script lang="ts">
    import Button from '../../button/button.svelte';
    import SideSheet from '../side-sheet.svelte';

    let outer = $state(false);
    let inner = $state(false);
</script>

<Button onclick={() => (outer = true)}>Open outer</Button>
<SideSheet bind:visible={outer} closeOnEsc motion={false} title="Outer">
    <Button onclick={() => (inner = true)}>Open inner</Button>
</SideSheet>
<SideSheet bind:visible={inner} closeOnEsc motion={false} title="Inner" />
<output aria-label="outer">{outer}</output>
<output aria-label="inner">{inner}</output>
