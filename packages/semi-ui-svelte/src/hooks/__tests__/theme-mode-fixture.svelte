<script lang="ts">
    import useThemeMode from '../use-theme-mode.svelte';

    const theme = useThemeMode();
</script>

<button type="button" onclick={() => theme.setMode(theme.mode === 'dark' ? 'light' : 'dark')}>
    {theme.mode}/{theme.preference}
</button>
