<script lang="ts">
    import { Calendar } from '@fibrae/semi-ui-svelte';

    // A fixed date keeps the server render and the browser on the same first frame
    const displayValue = new Date(2026, 9, 25);
</script>

<Calendar {displayValue} mode="month" />
