<script lang="ts">
    import { Calendar, Radio, RadioGroup, type WeekStartsOn } from '@fibrae/semi-ui-svelte';

    let weekStartsOn = $state(0);
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    // A fixed date keeps the server render and the browser on the same first frame
    const displayValue = new Date(2026, 9, 25);
</script>

<div>
    <RadioGroup aria-label="周起始日" bind:value={weekStartsOn} name="demo-radio-group-vertical" type="button">
        {#each days as day, index (day)}
            <Radio value={index}>{day}</Radio>
        {/each}
    </RadioGroup>
    <Calendar {displayValue} mode="month" style="margin-top: 20px" weekStartsOn={weekStartsOn as WeekStartsOn} />
</div>
