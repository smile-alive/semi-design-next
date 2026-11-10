<script lang="ts">
    import { Tooltip, Typography } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Typography.Title ellipsis={{ showTooltip: true }} heading={5} style="width: 250px">是一个很长很长很长很长5号标题</Typography.Title>
    <br />
    <Typography.Text ellipsis={{ showTooltip: true }} style="width: 150px">
        {#snippet ellipsisContent()}这是自定义要展示的内容{/snippet}
        可以自定义浮层里的展示内容试试看吧
    </Typography.Text>
    <br />
    <Typography.Text ellipsis={{ showTooltip: true, pos: 'middle' }} link style="width: 150px">是一个很长很长很长很长的链接</Typography.Text>
    <br />
    <Typography.Paragraph ellipsis={{ suffix: '小尾巴' }} style="width: 300px">有后缀的情况：Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。</Typography.Paragraph>
    <br />
    <Typography.Paragraph ellipsis={{ rows: 3 }} style="width: 300px"
        >这是一个多行截断的例子：Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</Typography.Paragraph
    >
    <br />
    <Typography.Paragraph ellipsis={{ rows: 3, showTooltip: { type: 'popover', opts: { style: 'width: 300px' } } }} style="width: 300px">
        多行截断，展示 Popover：Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
    </Typography.Paragraph>
    <br />
    <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, collapsible: true, collapseText: '折叠我吧', onExpand: (expanded, event) => console.log(expanded, event) }} style="width: 300px">
        支持展开和折叠：Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
    </Typography.Paragraph>
    <br />
    <Typography.Text ellipsis={{ showTooltip: true, pos: 'middle' }} style="width: 150px; word-break: break-word">
        {#snippet ellipsisContent()}全英文设置了word-break{/snippet}
        sssssssssssssssssssssssss
    </Typography.Text>
    <br />
    <br />
    <Typography.Title ellipsis={{ showTooltip: true }} heading={5} style="width: 250px">
        {#snippet ellipsisTooltip({ content: fullText, trigger })}
            <Tooltip style="background-color: var(--semi-color-primary)">
                {@render trigger()}
                {#snippet content()}{fullText}{/snippet}
            </Tooltip>
        {/snippet}
        这是一个自定义弹出层组件的省略文本，背景色是蓝色
    </Typography.Title>
</div>
