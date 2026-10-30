<script lang="ts">
    import { Avatar, Calendar } from '@fibrae/semi-ui-svelte';

    const displayValue = new Date(2023, 4, 14);
    const colors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'lime'] as const;
</script>

<Calendar {displayValue} height={400} mode="week">
    {#snippet dateDisplay({ date })}
        <div style="padding-block: 6px">
            <Avatar color={colors[date.getDay()]} size="small">{date.getDate()}</Avatar>
        </div>
    {/snippet}
</Calendar>
