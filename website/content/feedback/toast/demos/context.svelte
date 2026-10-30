<script lang="ts">
    import { getContext, setContext } from 'svelte';
    import { Button, Toast } from '@fibrae/semi-ui-svelte';

    const reachableKey = Symbol('reachable');
    setContext(reachableKey, 'Light');

    const toast = Toast.useToast();
</script>

<!-- The snippet renders inside the toast list mounted with this component's contexts, so it reads the context set above -->
{#snippet reachable()}ReachableContext: {getContext(reachableKey)}{/snippet}

<div>
    <Button onclick={() => toast.success({ duration: 0, content: reachable })}>Hook Toast</Button>
</div>
