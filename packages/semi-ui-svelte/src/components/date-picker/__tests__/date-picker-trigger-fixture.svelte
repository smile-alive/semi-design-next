<script lang="ts" module>
    import type { DatePickerProps } from '../interface';

    export interface TriggerFixtureStore {
        props: Omit<DatePickerProps, 'trigger'>;
    }
</script>

<script lang="ts">
    import DatePicker from '../date-picker.svelte';
    import type { DatePickerTriggerRenderProps } from '../interface';

    let { store }: { store: TriggerFixtureStore } = $props();
</script>

{#snippet trigger({ rangeInputFocus }: DatePickerTriggerRenderProps)}
    <div class="custom-trigger">{String(rangeInputFocus)}</div>
{/snippet}

<DatePicker {...store.props} {trigger} />
