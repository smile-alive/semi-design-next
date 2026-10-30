<script lang="ts">
    import FloatButton from '../float-button.svelte';

    let clicks = $state(0);
</script>

<FloatButton
    aria-label="Anchor"
    href="#float-prevent"
    onclick={(event) => {
        event.preventDefault();
        clicks++;
    }}
/>
<output aria-label="clicks">{clicks}</output>
