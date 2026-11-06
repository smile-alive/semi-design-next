<script lang="ts">
    import { DatePicker, Tooltip } from '@fibrae/semi-ui-svelte';

    const dateStyle = 'width: 100%; height: 100%; border: 1px solid var(--semi-color-primary); display: flex; justify-content: center; align-items: center';
</script>

<DatePicker>
    {#snippet date(dateProps)}
        {#if dateProps.dayNumber === 1}
            <Tooltip>
                {#snippet content()}Always Day 1{/snippet}
                <div style={dateStyle}>{dateProps.dayNumber}</div>
            </Tooltip>
        {:else}
            {dateProps.dayNumber}
        {/if}
    {/snippet}
</DatePicker>
