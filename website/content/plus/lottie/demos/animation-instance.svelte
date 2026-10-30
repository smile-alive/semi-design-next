<script lang="ts">
    import { Lottie, type LottieAnimation } from '@fibrae/semi-ui-svelte';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';
    const params = { path: jsonURL };

    const onAnimation = (animation: LottieAnimation) => {
        console.log(animation);
    };
</script>

<div>
    <Lottie getAnimationInstance={onAnimation} height="300px" {params} width="300px" />
</div>
