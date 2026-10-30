<script lang="ts">
    import { onMount } from 'svelte';
    import { Lottie } from '@fibrae/semi-ui-svelte';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';

    // large animation data is held in $state.raw so it is not made deeply reactive
    let data = $state.raw<object | string>('');
    // params reloads the animation when it is replaced, so it is derived from the data instead of mutated
    const params = $derived({ animationData: data });

    onMount(() => {
        void fetch(jsonURL)
            .then((resp) => resp.json())
            .then((json: object) => {
                data = json;
            });
    });
</script>

<div>
    <Lottie height="300px" {params} width="300px" />
</div>
