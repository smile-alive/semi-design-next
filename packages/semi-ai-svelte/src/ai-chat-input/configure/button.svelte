<script lang="ts">
    import ConfigureItem from './configure-item.svelte';
    import type { ConfigureButtonProps } from './interface.js';
    import ToggleButton from './toggle-button.svelte';

    let props: ConfigureButtonProps = $props();
</script>

<ConfigureItem {...props} component={ToggleButton} />
