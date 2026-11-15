<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { singleItemName } from '@fibrae/semi-foundation/components/form/json-schema';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
    import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@fibrae/semi-icons-svelte';
    import Button from '../../button/button.svelte';
    import useLocale from '../../locale/use-locale.svelte.js';
    import type { SchemaArrayContext } from '../interface.js';
    import SemiSection from './semi-section.svelte';

    let { context }: { context: SchemaArrayContext } = $props();

    const locale = useLocale('Form');

    const rowClass = `${cssClasses.PREFIX}-schema-array-row`;

    const withIndex = (text: string, index: number) => formatLocale(text, { index: index + 1 });
</script>

<SemiSection node={context.node} {...context.fieldProps}>
    {#each context.items as item (item.key)}
        <div class={[rowClass, singleItemName(item.node, locale().locale) !== undefined && `${rowClass}-single`]}>
            <div class="{rowClass}-content">
                {@render context.render(item.field)}
            </div>
            <div class="{rowClass}-actions">
                <Button aria-label={withIndex(locale().locale.moveUpItem, item.index)} disabled={item.index === 0} theme="borderless" type="tertiary" onclick={() => context.move(item.index, item.index - 1)}>
                    {#snippet icon()}<IconArrowUp />{/snippet}
                </Button>
                <Button aria-label={withIndex(locale().locale.moveDownItem, item.index)} disabled={item.index === context.count - 1} theme="borderless" type="tertiary" onclick={() => context.move(item.index, item.index + 1)}>
                    {#snippet icon()}<IconArrowDown />{/snippet}
                </Button>
                {#if !context.fixed}
                    <Button aria-label={withIndex(locale().locale.removeItem, item.index)} disabled={!context.canRemove} theme="borderless" type="tertiary" onclick={item.remove}>
                        {#snippet icon()}<IconDelete />{/snippet}
                    </Button>
                {/if}
            </div>
        </div>
    {/each}
    {#if !context.fixed}
        <Button disabled={!context.canAdd} onclick={context.add}>
            {#snippet icon()}<IconPlus />{/snippet}
            {locale().locale.addItem}
        </Button>
    {/if}
</SemiSection>
