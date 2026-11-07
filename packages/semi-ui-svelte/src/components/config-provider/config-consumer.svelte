<script lang="ts">
    import { getConfigContext } from './context.js';
    import type { ConfigConsumerProps } from './interface.js';

    let { children }: ConfigConsumerProps = $props();

    const config = getConfigContext();
</script>

{@render children(config)}
