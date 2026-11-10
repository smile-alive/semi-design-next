<script lang="ts">
    import { Typography } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Typography.Title ellipsis={{ showTooltip: true }} heading={5} style="width: 250px">是一个很长很长很长很长5号标题</Typography.Title>
    <br />
    <Typography.Text ellipsis={{ showTooltip: true, pos: 'middle' }} link style="width: 150px">是一个很长很长很长很长的链接</Typography.Text>
    <br />
    <br />
    <Typography.Paragraph ellipsis={{ rows: 3, showTooltip: { type: 'popover', opts: { style: 'width: 300px' } } }} style="width: 300px">
        多行截断，展示 Popover：Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
    </Typography.Paragraph>
</div>
