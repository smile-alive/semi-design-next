<script lang="ts">
    import { onMount } from 'svelte';
    import { Lottie, type LottieModule } from '@fibrae/semi-ui-svelte';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';
    const params = { path: jsonURL };

    const onLottie = (lottie: LottieModule) => {
        console.log('lottie', lottie);
    };

    onMount(() => {
        void Lottie.getLottie().then((lottie) => console.log('lottie', lottie));
    });
</script>

<div>
    <Lottie getLottie={onLottie} height="300px" {params} width="300px" />
</div>
