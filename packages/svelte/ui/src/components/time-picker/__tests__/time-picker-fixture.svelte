<script lang="ts" module>
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import type { TimePickerProps } from '../interface';

    export type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    export interface FixtureStore {
        /** Which prop the mode applies to; the other one is passed one-way (undefined: left out) */
        target: 'value' | 'open';
        mode: Mode;
        value?: TimePickerProps['value'];
        open?: boolean;
        accept: boolean;
        log: string[];
        props: Omit<TimePickerProps, 'value' | 'open'>;
        trigger?: 'button' | 'text';
        header?: boolean;
        footer?: boolean;
        panel?: boolean;
        prefix?: boolean;
        nested?: boolean;
        config?: { locale?: Locale; direction?: 'ltr' | 'rtl'; timeZone?: string | number };
        localeProvider?: Locale;
    }
</script>

<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import { Popover } from '../../popover';
    import type { TimePickerTriggerRenderProps } from '../interface';
    import TimePicker from '../time-picker.svelte';

    let { store }: { store: FixtureStore } = $props();

    let picker = $state<TimePicker>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const format = (value: unknown) => (Array.isArray(value) ? value.map((item) => (item instanceof Date ? item.toTimeString().slice(0, 8) : String(item))).join('|') : value instanceof Date ? value.toTimeString().slice(0, 8) : String(value));

    const common = $derived({
        ...store.props,
        onChange: (value: unknown, str: unknown) => log(`change ${format(value)} ${JSON.stringify(str)}`),
        onOpenChange: (open: boolean) => log(`open ${open}`),
        onFocus: (event: FocusEvent) => log(`focus ${event.type}`),
        onBlur: (event: MouseEvent) => log(`blur ${event.type}`),
        trigger: store.trigger === 'button' ? buttonTrigger : store.trigger === 'text' ? textTrigger : undefined,
        panelHeader: store.header ? header : undefined,
        panelFooter: store.nested ? nested : store.footer ? footer : undefined,
        panel: store.panel ? panel : undefined,
        prefix: store.prefix ? prefix : undefined,
    });

    export function api() {
        return picker;
    }
</script>

{#snippet buttonTrigger(scope: TimePickerTriggerRenderProps)}
    <button class="custom-trigger" data-type={scope.componentProps.type} data-value={String(scope.componentProps.value)} type="button">{scope.inputValue || scope.placeholder}</button>
{/snippet}

{#snippet textTrigger(scope: TimePickerTriggerRenderProps)}
    <span>{scope.inputValue || scope.placeholder}</span>
{/snippet}

{#snippet header({ index }: { index: number })}
    header {index}
{/snippet}

{#snippet footer({ index }: { index: number })}
    footer {index}
{/snippet}

{#snippet panel({ index }: { index: number })}
    panel {index}
{/snippet}

{#snippet prefix()}
    <span class="custom-prefix">前缀</span>
{/snippet}

{#snippet nested()}
    <Popover aria-label="Nested" motion={false} trigger="click">
        {#snippet child({ props })}<button {...props} type="button">nested trigger</button>{/snippet}
        {#snippet content()}<button type="button">inside nested</button>{/snippet}
    </Popover>
{/snippet}

{#snippet body()}
    {#if store.target === 'open' && store.mode === 'bind'}
        <TimePicker bind:open={store.open} bind:this={picker} {...common} value={store.value} />
    {:else if store.target === 'open' && store.mode === 'function'}
        <TimePicker
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
        <TimePicker bind:this={picker} {...common} bind:value={store.value} open={store.open} />
    {:else if store.mode === 'function'}
        <TimePicker
            bind:this={picker}
            {...common}
            bind:value={
                () => store.value,
                (value) => {
                    log(`set ${format(value)}`);
                    if (store.accept) store.value = value;
                }
            }
            open={store.open}
        />
    {:else if store.mode === 'one-way'}
        <TimePicker bind:this={picker} {...common} open={store.open} value={store.value} />
    {:else}
        <TimePicker bind:this={picker} {...common} open={store.open} />
    {/if}
{/snippet}

{#if store.localeProvider}
    <LocaleProvider locale={store.localeProvider}>{@render body()}</LocaleProvider>
{:else if store.config}
    <ConfigProvider {...store.config}>{@render body()}</ConfigProvider>
{:else}
    {@render body()}
{/if}
<button type="button">outside</button>
