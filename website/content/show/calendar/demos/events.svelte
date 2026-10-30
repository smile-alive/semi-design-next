<script lang="ts">
    import { Calendar, DatePicker, Radio, RadioGroup, type CalendarMode, type EventObject } from '@fibrae/semi-ui-svelte';

    let mode = $state('week');
    let displayValue = $state(new Date(2019, 6, 23, 8, 32, 0));

    const onChangeDate = (date: Date | Date[] | undefined) => {
        if (date instanceof Date) displayValue = date;
    };

    const dailyEventStyle = 'border-radius: 3px; box-sizing: border-box; border: var(--semi-color-primary) 1px solid; padding: 10px; background-color: var(--semi-color-primary-light-default); height: 100%; overflow: hidden';
    const allDayStyle = 'border-radius: 3px; box-sizing: border-box; border: var(--semi-color-bg-1) 1px solid; padding: 2px 4px; background-color: var(--semi-color-primary-light-active); height: 100%; overflow: hidden';
    // `daily` marks the events that keep the padded style outside the month view; any extra key is passed to the event snippet.
    const events: EventObject[] = [
        {
            key: '0',
            start: new Date(2019, 5, 25, 14, 45, 0),
            end: new Date(2019, 6, 26, 6, 18, 0),
            children: '6月25日 14:45 ~ 7月26日 6:18',
        },
        {
            key: '1',
            start: new Date(2019, 6, 18, 10, 0, 0),
            end: new Date(2019, 6, 30, 8, 0, 0),
            children: '7月18日 10:00 ~ 7月30日 8:00',
        },
        {
            key: '2',
            start: new Date(2019, 6, 19, 20, 0, 0),
            end: new Date(2019, 6, 23, 14, 0, 0),
            children: '7月19日 20:00 ~ 7月23日 14:00',
        },
        {
            key: '3',
            start: new Date(2019, 6, 21, 6, 0, 0),
            end: new Date(2019, 6, 25, 6, 0, 0),
            children: '7月21日 6:00 ~ 7月25日 6:00',
        },
        { key: '4', allDay: true, start: new Date(2019, 6, 22, 8, 0, 0), children: '7月22日 全天' },
        {
            key: '5',
            start: new Date(2019, 6, 22, 9, 0, 0),
            end: new Date(2019, 6, 23, 23, 0, 0),
            children: '7月22日 9:00 ~ 7月23日 23:00',
        },
        {
            key: '6',
            daily: true,
            start: new Date(2019, 6, 23, 8, 32, 0),
            end: new Date(2019, 6, 23, 8, 42, 0),
            children: '7月23日 8:32',
        },
        {
            key: '7',
            daily: true,
            start: new Date(2019, 6, 23, 14, 30, 0),
            end: new Date(2019, 6, 23, 20, 0, 0),
            children: '7月23日 14:30-20:00',
        },
        {
            key: '8',
            start: new Date(2019, 6, 25, 8, 0, 0),
            end: new Date(2019, 6, 27, 6, 0, 0),
            children: '7月25日 8:00 ~ 7月27日 6:00',
        },
        {
            key: '9',
            start: new Date(2019, 6, 26, 10, 0, 0),
            end: new Date(2019, 6, 27, 16, 0, 0),
            children: '7月26日 10:00 ~ 7月27日 16:00',
        },
    ];
    const range = $derived(mode === 'range' ? [new Date(2019, 6, 23), new Date(2019, 6, 26)] : []);
</script>

<RadioGroup aria-label="视图模式" bind:value={mode} type="button">
    <Radio value="day">日视图</Radio>
    <Radio value="week">周视图</Radio>
    <Radio value="month">月视图</Radio>
    <Radio value="range">多日视图</Radio>
</RadioGroup>
<br />
<br />
<DatePicker onChange={onChangeDate} value={displayValue} />
<br />
<br />
<Calendar {displayValue} {events} height={400} minEventHeight={40} mode={mode as CalendarMode} {range}>
    {#snippet event({ event })}
        <div style={event.daily && mode !== 'month' ? dailyEventStyle : allDayStyle}>{event.children}</div>
    {/snippet}
</Calendar>
