<script lang="ts">
    import { Calendar } from '@fibrae/semi-ui-svelte';

    const range = [new Date(2020, 8, 26), new Date(2020, 8, 31)];
</script>

<Calendar mode="range" {range} />
