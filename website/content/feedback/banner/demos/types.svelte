<script lang="ts">
    import { Banner } from '@fibrae/semi-ui-svelte';
</script>

<Banner type="info">
    {#snippet description()}Semi D2C 现已支持 Figma DevMode, 安装插件，随时查阅图层对应的前端代码{/snippet}
</Banner>
<br />
<Banner type="warning">
    {#snippet description()}当前使用 Figma UI Kit 为旧版，可能无法支持完整的 Design to code 能力{/snippet}
</Banner>
<br />
<Banner type="danger">
    {#snippet description()}当前使用 API 已过期，请尽快升级{/snippet}
</Banner>
<br />
<Banner type="success">
    {#snippet description()}Semi DSM, Make Semi Design to Any Design{/snippet}
</Banner>
