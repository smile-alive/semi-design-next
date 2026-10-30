<script lang="ts">
    import data from '@fibrae/semi-icons-core/icons/IconDesktop';
    import Icon, { type SemiIconProps } from '../components/built-in-icon.svelte';

    const props: SemiIconProps = $props();
</script>

<Icon {...props} {data} />
