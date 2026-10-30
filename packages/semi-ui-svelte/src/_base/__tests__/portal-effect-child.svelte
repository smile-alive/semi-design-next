<script lang="ts">
    let { container, runs }: { container: HTMLElement; runs: boolean[] } = $props();

    let button = $state.raw<HTMLButtonElement | null>(null);

    $effect(() => {
        if (!button) {
            return;
        }
        runs.push(container.contains(button));
        button.focus();
    });
</script>

<button bind:this={button} type="button">focus target</button>
