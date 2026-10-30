<script lang="ts">
    import { Calendar } from '@fibrae/semi-ui-svelte';

    const importantDate = 'position: absolute; left: 0; right: 0; top: 0; bottom: 0; background-color: var(--semi-color-danger-light-default)';
    const displayValue = new Date(2019, 6, 23, 8, 32, 0);
    const importDates = [new Date(2019, 6, 2), new Date(2019, 6, 8), new Date(2019, 6, 19), new Date(2019, 6, 23)];
    const importDateStrings = importDates.map((date) => date.toString());
</script>

<Calendar {displayValue} height={700} mode="month">
    {#snippet dateGrid({ dateString })}
        {#if importDateStrings.includes(dateString)}
            <div style={importantDate}></div>
        {/if}
    {/snippet}
</Calendar>
