<script lang="ts">
    import data from '@fibrae/semi-icons-core/illustrations/icons/IllustrationNoResult';
    import Svg, { type SvgProps } from '@fibrae/semi-icons-svelte/components/svg.svelte';

    const props: SvgProps = $props();
</script>

<Svg {...props} {data} />
