<script lang="ts" module>
    import type { DatePickerProps } from '../interface';

    export type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    export interface FixtureStore {
        /** Which prop the mode applies to; the other one is passed one-way (undefined: left out) */
        target: 'value' | 'open';
        mode: Mode;
        value?: DatePickerProps['value'];
        open?: boolean;
        accept: boolean;
        log: string[];
        props: Omit<DatePickerProps, 'value' | 'open'>;
        trigger?: 'button' | 'text';
        date?: boolean;
        fullDate?: boolean;
        slots?: boolean;
    }
</script>

<script lang="ts">
    import { format as formatDate } from 'date-fns';
    import DatePicker from '../date-picker.svelte';
    import type { DatePickerDateSnippetProps, DatePickerFullDateSnippetProps, DatePickerHandle, DatePickerTriggerRenderProps } from '../interface';

    let { store }: { store: FixtureStore } = $props();

    let picker = $state<DatePicker>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const show = (value: unknown): string => (Array.isArray(value) ? value.map(show).join('|') : value instanceof Date ? formatDate(value, 'yyyy-MM-dd HH:mm:ss') : String(value));

    const common = $derived({
        ...store.props,
        onChange: (value: unknown, str: unknown) => log(`change ${show(value)} ${JSON.stringify(str)}`),
        onOpenChange: (open: boolean) => log(`open ${open}`),
        onFocus: (event: Event, range?: string) => log(`focus ${event.type}${range ? ` ${range}` : ''}`),
        onBlur: (event?: MouseEvent) => log(`blur ${event?.type ?? 'none'}`),
        onClear: () => log('clear'),
        onConfirm: (value: unknown) => log(`confirm ${show(value)}`),
        onCancel: (value: unknown) => log(`cancel ${show(value)}`),
        onPanelChange: (value: unknown, str: unknown) => log(`panel ${show(value)} ${JSON.stringify(str)}`),
        onPresetClick: (item: { text?: string }) => log(`preset ${item.text}`),
        trigger: store.trigger === 'button' ? buttonTrigger : store.trigger === 'text' ? textTrigger : undefined,
        date: store.date ? dateCell : undefined,
        fullDate: store.fullDate ? fullDateCell : undefined,
        topSlot: store.slots ? top : undefined,
        bottomSlot: store.slots ? bottom : undefined,
    });

    // the annotation checks that the component instance satisfies the public DatePickerHandle
    export function api(): DatePickerHandle | undefined {
        return picker;
    }
</script>

{#snippet buttonTrigger(scope: DatePickerTriggerRenderProps)}
    <button class="custom-trigger" data-type={scope.componentProps.type} type="button">{scope.value.length ? scope.value.map((item) => formatDate(item, 'yyyy-MM-dd')).join(' ~ ') : scope.placeholder}</button>
{/snippet}

{#snippet textTrigger(scope: DatePickerTriggerRenderProps)}
    <span class="custom-text">{scope.value.length ? formatDate(scope.value[0], 'yyyy-MM-dd') : scope.placeholder}</span>
{/snippet}

{#snippet dateCell({ dayNumber, fullDate }: DatePickerDateSnippetProps)}
    <span class="custom-date" data-full={fullDate}>d{dayNumber}</span>
{/snippet}

{#snippet fullDateCell({ dayNumber, dayStatus }: DatePickerFullDateSnippetProps)}
    <span class={['custom-full', { 'custom-selected': dayStatus.isSelected }]}>{dayNumber}</span>
{/snippet}

{#snippet top()}<span class="custom-top">top</span>{/snippet}

{#snippet bottom()}<span class="custom-bottom">bottom</span>{/snippet}

{#if store.target === 'open' && store.mode === 'bind'}
    <DatePicker bind:open={store.open} bind:this={picker} {...common} value={store.value} />
{:else if store.target === 'open' && store.mode === 'function'}
    <DatePicker
        bind:open={
            () => store.open,
            (open) => {
                log(`set open ${open}`);
                if (store.accept) store.open = open;
            }
        }
        bind:this={picker}
        {...common}
        value={store.value}
    />
{:else if store.mode === 'bind'}
    <DatePicker bind:this={picker} {...common} bind:value={store.value} open={store.open} />
{:else if store.mode === 'function'}
    <DatePicker
        bind:this={picker}
        {...common}
        bind:value={
            () => store.value,
            (value) => {
                log(`set ${show(value)}`);
                if (store.accept) store.value = value;
            }
        }
        open={store.open}
    />
{:else if store.mode === 'one-way'}
    <DatePicker bind:this={picker} {...common} open={store.open} value={store.value} />
{:else}
    <DatePicker bind:this={picker} {...common} open={store.open} />
{/if}
<button type="button">outside</button>
