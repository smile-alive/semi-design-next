<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';
</script>

<h4>默认日期与时间选择</h4>
<DatePicker type="dateTime" />
<br />
<br />
<h4>开启时间列表无限循环</h4>
<DatePicker timePickerOpts={{ scrollItemProps: { mode: 'wheel', cycled: true } }} type="dateTime" />
