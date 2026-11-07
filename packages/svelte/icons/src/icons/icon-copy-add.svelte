<script lang="ts">
    import data from '@fibrae/semi-icons-core/icons/icon-copy-add';
    import Icon, { type SemiIconProps } from '../components/built-in-icon.svelte';

    const props: SemiIconProps = $props();
</script>

<Icon {...props} {data} />
