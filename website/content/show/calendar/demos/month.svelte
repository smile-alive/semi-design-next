<script lang="ts">
    import { Calendar } from '@fibrae/semi-ui-svelte';

    // A fixed date keeps the server render and the browser on the same first frame
    const displayValue = new Date(2019, 6, 23);
</script>

<Calendar {displayValue} mode="month" />
