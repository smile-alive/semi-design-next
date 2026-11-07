<script lang="ts">
    import data from '@fibrae/semi-icons-core/illustrations/illustration-no-access-dark';
    import Svg, { type SvgProps } from '@fibrae/semi-icons-svelte/components/svg.svelte';

    const props: SvgProps = $props();
</script>

<Svg {...props} {data} />
