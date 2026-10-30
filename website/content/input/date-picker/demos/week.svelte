<script lang="ts">
    import * as dateFns from 'date-fns';
    import { DatePicker } from '@fibrae/semi-ui-svelte';

    const handleChange = (date: Date | Date[] | undefined) => {
        console.log('date changed', date);
    };

    const startOfWeek = (date: Date) => dateFns.startOfWeek(date, { weekStartsOn: 1 });
    const endOfWeek = (date: Date) => dateFns.endOfWeek(date, { weekStartsOn: 1 });
    const endOfNextWeek = (date: Date) => dateFns.add(endOfWeek(date), { days: 7 });
    const sixDaysLater = (date: Date) => dateFns.add(date, { days: 6 });
</script>

<div>
    <h4>选择自然周</h4>
    <DatePicker endDateOffset={endOfWeek} onChange={handleChange} startDateOffset={startOfWeek} style="width: 260px" type="dateRange" weekStartsOn={1} />
    <br />
    <br />
    <h4>选择双周</h4>
    <DatePicker endDateOffset={endOfNextWeek} onChange={handleChange} startDateOffset={startOfWeek} style="width: 260px" type="dateRange" weekStartsOn={1} />
    <br />
    <br />
    <h4>选择当前日和后6日</h4>
    <DatePicker endDateOffset={sixDaysLater} onChange={handleChange} style="width: 260px" type="dateRange" weekStartsOn={1} />
    <br />
    <br />
</div>
