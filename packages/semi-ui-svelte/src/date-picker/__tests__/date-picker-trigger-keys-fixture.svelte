<script lang="ts" module>
    import type { DatePickerProps } from '../interface';

    export interface TriggerKeysFixtureStore {
        variant: 'inner' | 'pick';
        presses: number;
        props?: DatePickerProps;
    }
</script>

<script lang="ts">
    import DatePicker from '../date-picker.svelte';

    let { store }: { store: TriggerKeysFixtureStore } = $props();
</script>

{#snippet inner()}
    <div class="custom-trigger">
        <button
            aria-label="清除"
            type="button"
            onclick={(event) => {
                event.stopPropagation();
                store.presses += 1;
            }}
        ></button>
    </div>
{/snippet}

{#snippet pick()}
    <button type="button">pick</button>
{/snippet}

<DatePicker motion={false} trigger={store.variant === 'inner' ? inner : pick} {...store.props} />
