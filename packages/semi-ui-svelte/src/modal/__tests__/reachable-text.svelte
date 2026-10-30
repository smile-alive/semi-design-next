<script lang="ts">
    import { getReachable } from './reachable';

    // Read at init, so it shows the context of the place the snippet renders
    const value = getReachable();
</script>

ReachableContext: {value}
