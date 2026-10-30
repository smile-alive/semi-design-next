<script lang="ts">
    import { Image } from '@fibrae/semi-ui-svelte';

    const preview = {
        src: '/assets/root-web-sites/abstract-big.png',
    };
</script>

<Image alt="Abstract colorful artwork" height={200} {preview} src="/assets/root-web-sites/abstract-small.jpeg" width={300} />
