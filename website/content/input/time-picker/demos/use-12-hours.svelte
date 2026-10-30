<script lang="ts">
    import { TimePicker } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <TimePicker use12Hours />
    <br />
    <br />
    <TimePicker format="a h:mm" use12Hours />
</div>
