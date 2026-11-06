<script lang="ts">
    import { Lottie } from '@fibrae/semi-ui-svelte';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';
</script>

<div>
    <Lottie
        getAnimationInstance={(animation) => {
            console.log(animation);
        }}
        height="300px"
        params={{ path: jsonURL }}
        width="300px"
    />
</div>
