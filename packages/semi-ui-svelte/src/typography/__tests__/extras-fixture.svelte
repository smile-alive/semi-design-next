<script lang="ts">
    import { IconSetting } from '@fibrae/semi-icons-svelte';
    import { DropdownItem } from '../../dropdown';
    import { TypographyNumeral, TypographyParagraph, TypographyText } from '../index';

    type Kind = 'text' | 'paragraph';

    interface Props {
        mode:
            | 'numeralPrice'
            | 'numeralNested'
            | 'conditional'
            | 'buttonInside'
            | 'ellipsisContent'
            | 'noContent'
            | 'dropdownItem'
            | 'copyTips'
            | 'copyTipOnly'
            | 'textIcon'
            | 'plainCopyIcon'
            | 'gearCopyIcon'
            | 'inheritMiddle'
            | 'tip'
            | 'tipWithCopyAction'
            | 'copyActionExpand'
            | 'copyActionReserve'
            | 'copyActionOnly'
            | 'derivedEllipsis'
            | 'section';
        type?: 'tooltip' | 'popover';
        parser?: (value: string) => string;
        kind?: Kind;
        text?: string;
        props?: Record<string, unknown>;
        duration?: number;
        /** Read by the derivedEllipsis ellipsis object, whose values stay the same when `n` changes */
        counter?: { n: number };
    }

    const { mode, type = 'tooltip', parser, kind = 'text', text = '', props = {}, duration = 3, counter = { n: 1 } }: Props = $props();

    const Component = $derived(kind === 'paragraph' ? TypographyParagraph : TypographyText) as typeof TypographyText;
    const done = false as boolean;
    const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
</script>

{#if mode === 'numeralPrice'}
    <TypographyNumeral precision={2} rule="numbers" truncate="ceil">
        <div class="price"><span>预期价格:{1.555}; 成本: -1; 盈利: 0.555</span><b>Currency symbols: $</b></div>
    </TypographyNumeral>
    <TypographyNumeral {parser} precision={2} rule="exponential" truncate="floor">
        <div class="total">Total revenue: <b>$ 1992.15</b></div>
    </TypographyNumeral>
{:else if mode === 'numeralNested'}
    <TypographyNumeral precision={1}
        >{#each [1, 2] as item (item)}{item}{/each}{#if done}0{/if}<span>x<b>{3}</b></span></TypographyNumeral
    >
    <TypographyNumeral precision={1}>Stars <b>1</b><i>Fork <b>2</b></i></TypographyNumeral>
{:else if mode === 'conditional'}
    <TypographyText copyable
        >Bob{#if done}!{/if}</TypographyText
    >
    <TypographyParagraph ellipsis={{ expandable: true, expandText: 'EX' }} style="line-height: 20px"
        >ab{#if done}!{/if}cdefghijklmnopqrstuvwxyz</TypographyParagraph
    >
{:else if mode === 'buttonInside'}
    <TypographyText ellipsis={{ showTooltip: true }} style="width: 100px">text <button type="button">action</button></TypographyText>
{:else if mode === 'ellipsisContent'}
    <TypographyText ellipsis={{ showTooltip: { type } }} style="width: 100px">
        text
        {#snippet ellipsisContent()}<i>custom content</i>{/snippet}
    </TypographyText>
{:else if mode === 'noContent'}
    <TypographyText ellipsis={{ rows: 3, pos: 'middle', expandable: true }} />
    <TypographyText ellipsis />
{:else if mode === 'dropdownItem'}
    <DropdownItem active showTick>
        <TypographyText ellipsis={{ showTooltip: true }} style="width: 100px">checked text</TypographyText>
    </DropdownItem>
{:else if mode === 'copyTips'}
    <TypographyText copyable={{ content: 'configured' }}>
        children
        {#snippet copySuccessTip()}done{/snippet}
        {#snippet copyTip()}press{/snippet}
    </TypographyText>
{:else if mode === 'copyTipOnly'}
    <TypographyText copyable>
        Semi Design
        {#snippet copyTip()}Copy the text{/snippet}
    </TypographyText>
{:else if mode === 'textIcon'}
    <TypographyText size="small">
        a
        {#snippet icon()}<IconSetting /><i class="plain">x</i>{/snippet}
    </TypographyText>
{:else if mode === 'plainCopyIcon'}
    <TypographyText copyable>
        text
        {#snippet copyIcon()}复制{/snippet}
    </TypographyText>
{:else if mode === 'gearCopyIcon'}
    <TypographyText copyable={{ duration }}>
        gear
        {#snippet copyIcon()}<IconSetting />{/snippet}
    </TypographyText>
{:else if mode === 'inheritMiddle'}
    <TypographyParagraph size="small">
        <TypographyText class="mid" size="normal"><TypographyText class="inner" size="inherit">x</TypographyText></TypographyText>
    </TypographyParagraph>
{:else if mode === 'tip'}
    <Component {...props}>
        {text}
        {#snippet ellipsisTooltip({ content, trigger })}
            <b data-content={content} data-testid="tip">{@render trigger()}</b>
        {/snippet}
    </Component>
{:else if mode === 'tipWithCopyAction'}
    <TypographyText copyable={{ duration: 5 }} ellipsis={{ showTooltip: true }} style="width: 100px">
        {text}
        {#snippet ellipsisTooltip({ content, trigger })}
            <b data-content={content} data-testid="tip">{@render trigger()}</b>
        {/snippet}
        {#snippet copyAction({ config })}
            <button class="copy" data-content={config.content} data-duration={config.duration}>copy</button>
        {/snippet}
    </TypographyText>
{:else if mode === 'copyActionExpand'}
    <TypographyParagraph copyable ellipsis={{ expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' }} style="line-height: 20px">
        abcdefghijklmnopqrstuvwxyz
        {#snippet copyAction({ copied, copy })}
            <button class="copy" onclick={copy}>{String(copied)}</button>
        {/snippet}
    </TypographyParagraph>
{:else if mode === 'copyActionReserve'}
    <TypographyParagraph copyable ellipsis={{ rows: 1 }} style="line-height: 20px">
        abcdefghijklmnopqrstuvwxyz
        {#snippet copyAction()}<button type="button">CCCC</button>{/snippet}
    </TypographyParagraph>
{:else if mode === 'copyActionOnly'}
    <TypographyParagraph copyable={{ duration: 3 }}>
        Semi Design
        {#snippet copyAction({ copied, copy })}
            <button onclick={copy}>{copied ? 'copied' : 'copy'}</button>
        {/snippet}
    </TypographyParagraph>
{:else if mode === 'derivedEllipsis'}
    <TypographyParagraph ellipsis={{ expandable: true, expandText: 'EX', showTooltip: Math.min(counter.n, 1) === 1 }} style="line-height: 20px">{LETTERS}</TypographyParagraph>
{:else}
    <section><TypographyText ellipsis={{ showTooltip: true }} style="width: 100px">overflowing text</TypographyText></section>
{/if}
