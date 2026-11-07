<script lang="ts">
    import { onMount } from 'svelte';
    import { Lottie } from '@fibrae/semi-ui-svelte';

    const jsonURL = '/assets/root-web-sites/lottie-demo.json';

    onMount(() => {
        void Lottie.getLottie().then((lottie) => console.log('lottie', lottie));
    });
</script>

<div>
    <Lottie getLottie={(lottie) => console.log('lottie', lottie)} height="300px" params={{ path: jsonURL }} width="300px" />
</div>
