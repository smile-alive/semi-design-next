<script lang="ts">
    import { Button } from '@fibrae/semi-ui-svelte';

    const switchMode = () => {
        const body = document.body;
        if (body.hasAttribute('theme-mode')) {
            body.removeAttribute('theme-mode');
        } else {
            body.setAttribute('theme-mode', 'dark');
        }
    };
</script>

<Button onclick={switchMode}>Switch Mode</Button>
