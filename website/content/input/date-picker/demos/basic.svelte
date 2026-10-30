<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';
</script>

<DatePicker onChange={(_date, dateString) => console.log(dateString)} />
