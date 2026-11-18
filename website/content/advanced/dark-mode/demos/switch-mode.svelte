<script lang="ts">
    import { Button } from '@fibrae/semi-ui-svelte';

    const switchMode = () => {
        const root = document.documentElement;
        if (root.hasAttribute('theme-mode')) {
            root.removeAttribute('theme-mode');
        } else {
            root.setAttribute('theme-mode', 'dark');
        }
    };
</script>

<Button onclick={switchMode}>Switch Mode</Button>
