<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';

    const prefix = 'components-datepicker-demo';
    const dayStyle = 'display: flex; align-items: center; justify-content: center; width: 80%; height: 80%; border-radius: var(--semi-border-radius-circle)';
</script>

<DatePicker style="width: 260px" type="dateRange">
    {#snippet fullDate({ dayNumber, dayStatus })}
        <div
            class={{
                [`${prefix}-day-inrange`]: dayStatus.isInRange,
                [`${prefix}-day-hover`]: dayStatus.isHover,
                [`${prefix}-day-selected`]: dayStatus.isSelected,
                [`${prefix}-day-selected-start`]: dayStatus.isSelectedStart,
                [`${prefix}-day-selected-end`]: dayStatus.isSelectedEnd,
            }}
            style={dayStyle}
        >
            {dayNumber}
        </div>
    {/snippet}
</DatePicker>
