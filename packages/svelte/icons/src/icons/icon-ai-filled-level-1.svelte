<script lang="ts">
    import data from '@fibrae/semi-icons-core/icons/icon-ai-filled-level-1';
    import Icon, { type SemiIconProps } from '../components/built-in-icon.svelte';

    const props: SemiIconProps = $props();
</script>

<Icon {...props} {data} />
