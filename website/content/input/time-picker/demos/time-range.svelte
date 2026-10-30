<script lang="ts">
    import { TimePicker } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <TimePicker type="timeRange" value={['10:23:15', '12:38:32']} />
    <br />
    <br />
    <TimePicker format="a h:mm" type="timeRange" use12Hours value={['上午 08:11', '下午 11:21']} />
</div>
