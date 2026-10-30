<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';

    const value = new Date(2024, 4, 6, 10, 30, 0);
</script>

<DatePicker style="width: 140px" type="month" {value} />
