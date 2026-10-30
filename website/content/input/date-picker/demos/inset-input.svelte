<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <DatePicker insetInput type="date" />
    <br />
    <br />
    <DatePicker insetInput type="dateTime" />
    <br />
    <br />
    <DatePicker insetInput style="width: 260px" type="dateRange" />
    <br />
    <br />
    <DatePicker insetInput style="width: 400px" type="dateTimeRange" />
    <br />
    <br />
    <DatePicker insetInput placeholder="请选择年月" style="width: 140px" type="month" />
    <br />
    <br />
    <DatePicker insetInput placeholder="请选择年月范围" style="width: 200px" type="monthRange" />
    <br />
    <br />
    <DatePicker insetInput position="bottomLeft" type="date" />
    <br />
    <br />
    <DatePicker format="yyyy-MM-dd HH:mm" insetInput type="dateTime" />
</div>
