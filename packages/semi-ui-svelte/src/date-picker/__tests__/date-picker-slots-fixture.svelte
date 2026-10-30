<script lang="ts" module>
    import type { DatePickerProps } from '../interface';

    export interface SlotsFixtureStore {
        props: Omit<DatePickerProps, 'prefix' | 'insetLabel'>;
        prefix?: boolean;
        insetLabel?: boolean;
    }
</script>

<script lang="ts">
    import DatePicker from '../date-picker.svelte';

    let { store }: { store: SlotsFixtureStore } = $props();
</script>

{#snippet prefix()}<span class="custom-prefix">前缀</span>{/snippet}

{#snippet insetLabel()}日期{/snippet}

<DatePicker {...store.props} insetLabel={store.insetLabel ? insetLabel : undefined} prefix={store.prefix ? prefix : undefined} />
