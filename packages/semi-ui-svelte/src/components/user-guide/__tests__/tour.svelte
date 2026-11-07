<script lang="ts">
    import { untrack } from 'svelte';
    import { Button } from '../../button';
    import type { UserGuideStepItem } from '../interface';
    import UserGuide from '../user-guide.svelte';

    let { mask, mode, startVisible = false, inner = false }: { mask?: boolean; mode?: 'popup' | 'modal'; startVisible?: boolean; inner?: boolean } = $props();

    let visible = $state(untrack(() => startVisible));

    // A custom element inside the card whose focus lives in a shadow root
    const shadowInput = (node: HTMLElement) => {
        node.attachShadow({ mode: 'open' }).innerHTML = '<input aria-label="inner">';
    };

    const steps: UserGuideStepItem[] = $derived([
        { target: () => document.querySelector<HTMLElement>('#tour-a'), title: 'Step A', description: inner ? innerHost : undefined },
        { target: () => document.querySelector<HTMLElement>('#tour-b'), title: 'Step B' },
    ]);
</script>

{#snippet innerHost()}
    <div {@attach shadowInput} data-testid="inner-host"></div>
{/snippet}

<Button id="tour-a" onclick={() => (visible = true)}>Start</Button>
<Button id="tour-b">Second</Button>
<Button onclick={() => (visible = false)}>Elsewhere</Button>
<UserGuide bind:visible {mask} {mode} steps={inner ? steps.slice(0, 1) : steps} />
