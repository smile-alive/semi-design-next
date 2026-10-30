<script lang="ts">
    import { Calendar } from '@fibrae/semi-ui-svelte';

    const dailyEventStyle = 'position: absolute; left: 0; right: 0; border-radius: 3px; box-sizing: border-box; border: var(--semi-color-primary) 1px solid; padding: 10px; background-color: var(--semi-color-primary-light-default); overflow: hidden';
    const displayValue = new Date(2019, 6, 23, 8, 32, 0);
    const targetDateString = new Date(2019, 6, 23).toString();
</script>

<Calendar {displayValue} height={700} mode="week">
    {#snippet dateGrid({ dateString })}
        {#if dateString === targetDateString}
            <div style="{dailyEventStyle}; top: 500px; height: 50px">吃饭 🍰</div>
            <div style="{dailyEventStyle}; top: 0; height: 400px">睡觉 😪</div>
            <div style="{dailyEventStyle}; top: 700px; height: 100px">打豆豆 🎮</div>
        {/if}
    {/snippet}
</Calendar>
