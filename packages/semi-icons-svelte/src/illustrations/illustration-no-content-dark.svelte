<script lang="ts">
    import data from '@fibrae/semi-icons-core/illustrations/illustration-no-content-dark';
    import Svg, { type SvgProps } from '../components/svg.svelte';

    const props: SvgProps = $props();
</script>

<Svg {...props} {data} />
