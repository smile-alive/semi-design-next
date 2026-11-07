<script lang="ts">
    import Calendar from '../calendar.svelte';
    import type { CalendarProps } from '../interface';

    let { store }: { store: { props: CalendarProps } } = $props();
</script>

<Calendar {...store.props} />
