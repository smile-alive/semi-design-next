<script lang="ts">
    import Calendar from '../calendar.svelte';
    import type { CalendarProps } from '../interface';

    let { store }: { store: { hidden?: boolean; props: CalendarProps } } = $props();
</script>

<button type="button">before</button>
<div style:display={store.hidden ? 'none' : undefined}>
    <Calendar {...store.props} />
</div>
