<script lang="ts">
    import data from '@fibrae/semi-icons-core/icons/icon-credit-card';
    import Icon, { type SemiIconProps } from '../components/built-in-icon.svelte';

    const props: SemiIconProps = $props();
</script>

<Icon {...props} {data} />
