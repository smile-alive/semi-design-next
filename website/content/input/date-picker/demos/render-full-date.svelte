<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';

    const prefix = 'components-datepicker-demo';
    const dayStyle = 'display: flex; align-items: center; justify-content: center; width: 80%; height: 80%; border-radius: var(--semi-border-radius-circle)';
</script>

<DatePicker style="width: 260px" type="dateRange">
    {#snippet fullDate(fullDateProps)}
        <div
            class={{
                [`${prefix}-day-inrange`]: fullDateProps.dayStatus.isInRange,
                [`${prefix}-day-hover`]: fullDateProps.dayStatus.isHover,
                [`${prefix}-day-selected`]: fullDateProps.dayStatus.isSelected,
                [`${prefix}-day-selected-start`]: fullDateProps.dayStatus.isSelectedStart,
                [`${prefix}-day-selected-end`]: fullDateProps.dayStatus.isSelectedEnd,
            }}
            style={dayStyle}
        >
            {fullDateProps.dayNumber}
        </div>
    {/snippet}
</DatePicker>
