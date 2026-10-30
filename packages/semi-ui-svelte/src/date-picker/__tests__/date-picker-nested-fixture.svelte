<script lang="ts" module>
    import type { DatePickerProps } from '../interface';

    export interface NestedFixtureStore {
        /** What the panel's topSlot holds */
        nested: 'popover' | 'time-picker';
        open?: boolean;
        props?: DatePickerProps;
    }
</script>

<script lang="ts">
    import Popover from '../../popover/popover.svelte';
    import TimePicker from '../../time-picker/time-picker.svelte';
    import DatePicker from '../date-picker.svelte';

    let { store }: { store: NestedFixtureStore } = $props();
</script>

{#snippet nestedPopover()}
    <Popover aria-label="Nested" motion={false} trigger="click">
        <button type="button">nested trigger</button>
        {#snippet content()}<button type="button">inside nested</button>{/snippet}
    </Popover>
{/snippet}

{#snippet nestedTimePicker()}
    <TimePicker aria-label="nested time" motion={false} open stopPropagation={false} />
{/snippet}

<DatePicker motion={false} open={store.open} topSlot={store.nested === 'popover' ? nestedPopover : nestedTimePicker} {...store.props} />
