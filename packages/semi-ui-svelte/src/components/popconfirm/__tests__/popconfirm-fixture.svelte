<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { RenderContentProps, TooltipTriggerProps } from '../../tooltip';
    import type { PopconfirmProps } from '../interface';
    import Popconfirm from '../popconfirm.svelte';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    let {
        mode = 'uncontrolled',
        store,
    }: {
        mode?: Mode;
        store: {
            value?: boolean;
            accept: boolean;
            log: string[];
            shown: boolean;
            rtl: boolean;
            titleSnippet: boolean;
            content: 'none' | 'text' | 'input';
            icon: 'default' | 'none' | 'custom';
            props: Omit<PopconfirmProps, 'visible' | 'children' | 'child' | 'content' | 'icon'>;
        };
    } = $props();

    let confirm = $state<Popconfirm>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const common = $derived({
        ...store.props,
        title: store.titleSnippet ? titleSnippet : store.props.title,
        content: store.content === 'none' ? undefined : content,
        icon: store.icon === 'default' ? undefined : store.icon === 'none' ? null : customIcon,
        afterClose: () => log('afterClose'),
        afterOpen: () => log('afterOpen'),
        onOpen: () => log('open'),
        onVisibleChange: (value: boolean) => log(`change ${value}`),
        onEscKeyDown: (event: KeyboardEvent) => log(`esc ${event instanceof KeyboardEvent}`),
        onClickOutSide: (event: MouseEvent) => log(`outside ${event instanceof MouseEvent}`),
    });
</script>

{#snippet titleSnippet()}
    <strong>snippet title</strong>
{/snippet}

{#snippet content({ initialFocusRef }: RenderContentProps)}
    {#if store.content === 'input'}
        <input {@attach initialFocusRef} placeholder="focus here" />
    {:else}
        <span class="test-text">此修改将不可逆</span>
    {/if}
{/snippet}

{#snippet customIcon()}
    <b data-testid="custom-icon">!</b>
{/snippet}

{#snippet child({ props: triggerProps }: { props: TooltipTriggerProps })}
    <button {...triggerProps} type="button">Save</button>
{/snippet}

{#snippet body()}
    {#if store.shown}
        {#if mode === 'bind'}
            <Popconfirm bind:this={confirm} bind:visible={store.value} {...common} {child} />
        {:else if mode === 'function'}
            <Popconfirm
                bind:this={confirm}
                bind:visible={
                    () => store.value,
                    (value) => {
                        log(`set ${value}`);
                        if (store.accept) store.value = value;
                    }
                }
                {...common}
                {child}
            />
        {:else if mode === 'one-way'}
            <Popconfirm bind:this={confirm} {child} visible={store.value} {...common} />
        {:else}
            <Popconfirm bind:this={confirm} {...common} {child} />
        {/if}
    {/if}
{/snippet}

<input aria-label="outside" />
{#if store.rtl}
    <ConfigProvider direction="rtl">{@render body()}</ConfigProvider>
{:else}
    {@render body()}
{/if}
<button type="button" onclick={() => confirm?.focusTrigger()}>focus</button>
<output aria-label="visible">{String(store.value)}</output>
