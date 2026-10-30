<script lang="ts">
    import { Lottie } from '@fibrae/semi-ui-svelte';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';
    const params = { path: jsonURL };
</script>

<div>
    <Lottie height="300px" {params} width="300px" />
</div>
