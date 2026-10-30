<script lang="ts">
    import { Dropdown, DropdownItem, DropdownMenu, type DropdownProps } from '..';
    import { ConfigProvider } from '../../config-provider';

    type Mode = DropdownProps['selectionMode'];

    interface Store {
        log: string[];
        direction?: 'ltr' | 'rtl';
        // opens every level by `visible`, with no trigger events
        open: boolean;
        outerTrigger: 'click' | 'hover';
        innerTrigger: 'click' | 'hover';
        outerTick: boolean;
        innerTick: boolean;
        outerMode?: Mode;
        innerMode?: Mode;
        closeOnEsc: boolean;
    }

    let { store }: { store: Store } = $props();

    const log = (entry: string) => store.log.push(entry);
</script>

<p>before</p>
<ConfigProvider direction={store.direction}>
    <Dropdown closeOnEsc={store.closeOnEsc} motion={false} selectionMode={store.outerMode} showTick={store.outerTick} trigger={store.open ? 'custom' : store.outerTrigger} visible={store.open ? true : undefined}>
        {#snippet child({ props })}
            <button {...props} type="button">outer trigger</button>
        {/snippet}
        {#snippet content()}
            <DropdownMenu>
                <DropdownItem onclick={() => log('outer')}>Alpha</DropdownItem>
                <Dropdown closeOnEsc={store.closeOnEsc} motion={false} position="rightTop" selectionMode={store.innerMode} showTick={store.innerTick} trigger={store.open ? 'custom' : store.innerTrigger} visible={store.open ? true : undefined}>
                    {#snippet child({ props })}
                        <DropdownItem {...props} active onclick={() => log('parent click')} onmousedown={() => log('parent mousedown')}>Parent</DropdownItem>
                    {/snippet}
                    {#snippet content()}
                        <DropdownMenu>
                            <DropdownItem onclick={() => log('inner one')} onmousedown={() => log('inner mousedown')}>Inner one</DropdownItem>
                            <DropdownItem disabled>Inner disabled</DropdownItem>
                            <DropdownItem>Inner two</DropdownItem>
                        </DropdownMenu>
                    {/snippet}
                </Dropdown>
                <DropdownItem>Omega</DropdownItem>
            </DropdownMenu>
        {/snippet}
    </Dropdown>
</ConfigProvider>
<button type="button">after</button>
