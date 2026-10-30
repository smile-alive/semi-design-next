<script lang="ts" module>
    import type { DatePickerProps, DatePickerTriggerRenderProps } from '../interface';

    export interface SnippetsFixtureStore {
        props: Omit<DatePickerProps, 'trigger' | 'leftSlot' | 'rightSlot' | 'rangeSeparatorNode'>;
        /** A trigger with its own input and clear button, driven through the snippet's callbacks */
        inputTrigger?: boolean;
        sides?: boolean;
        separatorNode?: boolean;
    }
</script>

<script lang="ts">
    import DatePicker from '../date-picker.svelte';

    // record stays outside the store: it runs while the snippet renders, where writing state is not allowed
    let { store, record = () => undefined }: { store: SnippetsFixtureStore; record?: (scope: DatePickerTriggerRenderProps) => void } = $props();

    const seen = (scope: DatePickerTriggerRenderProps) => {
        record(scope);
        return scope;
    };
</script>

{#snippet inputTrigger(raw: DatePickerTriggerRenderProps)}
    {@const scope = seen(raw)}
    <div>
        <input aria-label="custom" value={scope.inputValue ?? ''} oninput={(event) => scope.onChange(event.currentTarget.value)} onkeydown={(event) => event.key === 'Enter' && scope.onEnterPress(event.currentTarget.value)} />
        <button type="button" onclick={(event) => scope.onClear(event)}>clear</button>
    </div>
{/snippet}

{#snippet left()}<span>left</span>{/snippet}

{#snippet right()}<span>right</span>{/snippet}

{#snippet separator()}<span class="custom-separator">to</span>{/snippet}

<DatePicker {...store.props} leftSlot={store.sides ? left : undefined} rangeSeparatorNode={store.separatorNode ? separator : undefined} rightSlot={store.sides ? right : undefined} trigger={store.inputTrigger ? inputTrigger : undefined} />
