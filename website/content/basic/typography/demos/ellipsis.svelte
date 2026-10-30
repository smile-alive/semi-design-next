<script lang="ts">
    import { Tooltip, TypographyParagraph, TypographyText, TypographyTitle } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <TypographyTitle ellipsis={{ showTooltip: true }} heading={5} style="width: 250px">是一个很长很长很长很长5号标题</TypographyTitle>
    <br />
    <TypographyText ellipsis={{ showTooltip: true }} style="width: 150px">
        {#snippet ellipsisContent()}这是自定义要展示的内容{/snippet}
        可以自定义浮层里的展示内容试试看吧
    </TypographyText>
    <br />
    <TypographyText ellipsis={{ showTooltip: true, pos: 'middle' }} link style="width: 150px">是一个很长很长很长很长的链接</TypographyText>
    <br />
    <TypographyParagraph ellipsis={{ suffix: '小尾巴' }} style="width: 300px">有后缀的情况：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。</TypographyParagraph>
    <br />
    <TypographyParagraph ellipsis={{ rows: 3 }} style="width: 300px">这是一个多行截断的例子：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</TypographyParagraph>
    <br />
    <TypographyParagraph ellipsis={{ rows: 3, showTooltip: { type: 'popover', opts: { style: 'width: 300px' } } }} style="width: 300px">
        多行截断，展示 Popover：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
    </TypographyParagraph>
    <br />
    <TypographyParagraph ellipsis={{ rows: 3, expandable: true, collapsible: true, collapseText: '折叠我吧', onExpand: (expanded, event) => console.log(expanded, event) }} style="width: 300px">
        支持展开和折叠：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
    </TypographyParagraph>
    <br />
    <TypographyText ellipsis={{ showTooltip: true, pos: 'middle' }} style="width: 150px; word-break: break-word">
        {#snippet ellipsisContent()}全英文设置了word-break{/snippet}
        sssssssssssssssssssssssss
    </TypographyText>
    <br />
    <br />
    <TypographyTitle ellipsis={{ showTooltip: true }} heading={5} style="width: 250px">
        {#snippet ellipsisTooltip({ content: fullText, trigger })}
            <Tooltip style="background-color: var(--semi-color-primary)">
                {@render trigger()}
                {#snippet content()}{fullText}{/snippet}
            </Tooltip>
        {/snippet}
        这是一个自定义弹出层组件的省略文本，背景色是蓝色
    </TypographyTitle>
</div>
