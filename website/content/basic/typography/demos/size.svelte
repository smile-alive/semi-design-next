<script lang="ts">
    import { Typography } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Typography.Text>正常文本</Typography.Text>
    <Typography.Paragraph spacing="extended">Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</Typography.Paragraph>
    <br />
    <Typography.Text size="small">小文本</Typography.Text>
    <Typography.Paragraph size="small">Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</Typography.Paragraph>
    <br />
    <Typography.Text size="small">
        这是一段文本，样式为 small
        <Typography.Text link size="inherit">这是一段链接，设置 size 为 inherit 继承外部样式设置</Typography.Text>
    </Typography.Text>
</div>
