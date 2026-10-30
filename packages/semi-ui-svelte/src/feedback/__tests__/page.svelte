<script lang="ts">
    import Button from '../../button/button.svelte';
    import Feedback from '../feedback.svelte';

    let { mode = 'popup' }: { mode?: 'modal' | 'popup' } = $props();

    let visible = $state(false);
</script>

<Button onclick={() => (visible = true)}>Open</Button>
<Feedback bind:visible {mode} title="Feedback" />
<output aria-label="visible">{visible}</output>
