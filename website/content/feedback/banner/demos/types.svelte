<script lang="ts">
    import { Banner } from '@fibrae/semi-ui-svelte';
</script>

<Banner type="info">
    {#snippet description()}一套组件，四个框架原生可用，随时查阅对应的前端代码{/snippet}
</Banner>
<br />
<Banner type="warning">
    {#snippet description()}当前使用的 UI Kit 为旧版，可能无法支持完整的组件能力{/snippet}
</Banner>
<br />
<Banner type="danger">
    {#snippet description()}当前使用 API 已过期，请尽快升级{/snippet}
</Banner>
<br />
<Banner type="success">
    {#snippet description()}Semi Design Next themes through --semi-* variables{/snippet}
</Banner>
