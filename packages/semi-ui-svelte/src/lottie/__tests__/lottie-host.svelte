<script lang="ts">
    import type { LottieProps } from '../interface';
    import Lottie from '../lottie.svelte';

    let { store }: { store: LottieProps } = $props();
</script>

<Lottie {...store} />
