<script lang="ts">
    import { TypographyParagraph, TypographyText, TypographyTitle } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <TypographyTitle ellipsis={{ showTooltip: true }} heading={5} style="width: 250px">是一个很长很长很长很长5号标题</TypographyTitle>
    <br />
    <TypographyText ellipsis={{ showTooltip: true, pos: 'middle' }} link style="width: 150px">是一个很长很长很长很长的链接</TypographyText>
    <br />
    <br />
    <TypographyParagraph ellipsis={{ rows: 3, showTooltip: { type: 'popover', opts: { style: 'width: 300px' } } }} style="width: 300px">
        多行截断，展示 Popover：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
    </TypographyParagraph>
</div>
