<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/descriptions/constants';
    import DescriptionsFoundation from '@fibrae/semi-foundation/descriptions/foundation';
    import '@fibrae/semi-foundation/descriptions/descriptions.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import type { DescriptionsData, DescriptionsProps } from './interface.js';

    const defaults = useDefaultProps('Descriptions');
    const { align = defaults('align', 'center'), row = defaults('row', false), size = defaults('size', 'medium'), data = defaults('data', []), layout = defaults('layout', 'vertical'), column = defaults('column', 3), itemKey, value, ...rest }: DescriptionsProps = $props();

    const prefixCls = cssClasses.PREFIX;

    const horizontalRows = $derived(
        layout === 'horizontal'
            ? DescriptionsFoundation.getHorizontalList(
                  data.map((item, index) => ({ item, index, hidden: item.hidden, span: item.span })),
                  column
              )
            : []
    );
</script>

{#snippet cells(item: DescriptionsData, index: number, span: number | undefined)}
    {#if align === 'plain'}
        <td class={`${prefixCls}-item`} colspan={span || 1}>
            <span class={`${prefixCls}-key`} style={item.keyStyle}>
                {#if itemKey}{@render itemKey({ item, index })}{:else}{item.key}{/if}:</span
            >
            <span class={`${prefixCls}-value`}>
                {#if value}{@render value({ item, index })}{:else}{item.value}{/if}
            </span>
        </td>
    {:else}
        <th class={[`${prefixCls}-item`, `${prefixCls}-item-th`]}>
            <span class={`${prefixCls}-key`} style={item.keyStyle}>
                {#if itemKey}{@render itemKey({ item, index })}{:else}{item.key}{/if}
            </span>
        </th>
        <td class={[`${prefixCls}-item`, `${prefixCls}-item-td`]} colspan={span ? span * 2 - 1 : 1}>
            <span class={`${prefixCls}-value`}>
                {#if value}{@render value({ item, index })}{:else}{item.value}{/if}
            </span>
        </td>
    {/if}
{/snippet}

<div
    {...rest}
    class={[
        prefixCls,
        rest.class,
        {
            [`${prefixCls}-${align}`]: !row,
            [`${prefixCls}-double`]: row,
            [`${prefixCls}-double-${size}`]: row,
            [`${prefixCls}-horizontal`]: layout === 'horizontal',
            [`${prefixCls}-vertical`]: layout === 'vertical',
        },
    ]}
>
    <table>
        <tbody>
            {#if layout === 'horizontal'}
                {#each horizontalRows as columns, rowIndex (rowIndex)}
                    <tr>
                        {#each columns as entry (entry.index)}
                            {@render cells(entry.item, entry.index, entry.span)}
                        {/each}
                    </tr>
                {/each}
            {:else}
                {#each data as item, index (index)}
                    {#if !item.hidden}
                        <tr>
                            {@render cells(item, index, item.span)}
                        </tr>
                    {/if}
                {/each}
            {/if}
        </tbody>
    </table>
</div>
