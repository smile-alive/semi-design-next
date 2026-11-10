<script lang="ts" module>
    import type { DatePickerProps, DatePickerTriggerRenderProps } from '../interface';

    export interface ScenarioStore {
        scenario: 'focus-open' | 'bottom-button' | 'reset-trigger' | 'trigger-scope' | 'tabs';
        open?: boolean;
        value?: DatePickerProps['value'];
        props?: DatePickerProps;
    }
</script>

<script lang="ts">
    import { Tabs } from '../../tabs';
    import DatePicker from '../date-picker.svelte';
    import type { DatePickerHandle } from '../interface';

    let { store }: { store: ScenarioStore } = $props();

    let docPicker = $state<DatePickerHandle>();

    const tabList = [
        { itemKey: '1', tab: 'doc' },
        { itemKey: '2', tab: 'start' },
    ];
</script>

{#snippet closeButton()}<button type="button" onclick={() => (store.open = false)}>close</button>{/snippet}

{#snippet slotButton()}<button type="button">slot</button>{/snippet}

{#snippet resetTrigger()}
    <div>
        <button type="button">trigger</button>
        <button
            type="button"
            onclick={(event) => {
                event.stopPropagation();
                store.value = null;
            }}>clear</button
        >
    </div>
{/snippet}

{#snippet scopeTrigger(scope: DatePickerTriggerRenderProps)}
    <span data-keys={Object.keys(scope.componentProps).join(',')} data-type={scope.componentProps.type}>trigger</span>
{/snippet}

{#snippet panel({ itemKey }: { itemKey: string })}
    {#if itemKey === '1'}
        <DatePicker bind:this={docPicker} motion={false} needConfirm type="dateTime" />
    {:else}
        <DatePicker motion={false} needConfirm type="dateTimeRange" />
    {/if}
{/snippet}

{#if store.scenario === 'focus-open'}
    <DatePicker {...store.props} bottomSlot={closeButton} onFocus={() => (store.open = true)} open={store.open} showClear />
{:else if store.scenario === 'bottom-button'}
    <DatePicker {...store.props} bottomSlot={slotButton} />
{:else if store.scenario === 'reset-trigger'}
    <DatePicker {...store.props} bind:value={store.value} trigger={resetTrigger} />
{:else if store.scenario === 'trigger-scope'}
    <DatePicker {...store.props} trigger={scopeTrigger} />
{:else}
    <Tabs onChange={(key) => key === '2' && docPicker?.close()} {panel} {tabList} type="line" />
{/if}
