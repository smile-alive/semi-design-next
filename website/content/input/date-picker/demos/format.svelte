<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';

    const value = new Date(2024, 4, 6, 10, 30, 0);
</script>

<DatePicker format="yyyy年MM月dd日 HH:mm" type="dateTime" {value} />
