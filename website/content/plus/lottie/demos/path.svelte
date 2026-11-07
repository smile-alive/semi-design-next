<script lang="ts">
    import { Lottie } from '@fibrae/semi-ui-svelte';

    const jsonURL = '/assets/root-web-sites/lottie-demo.json';
</script>

<div>
    <Lottie height="300px" params={{ path: jsonURL }} width="300px" />
</div>
