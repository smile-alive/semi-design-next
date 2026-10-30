<script lang="ts">
    import { IconCamera, IconChevronDown, IconSidebar } from '@fibrae/semi-icons-svelte';
    import { Button } from '@fibrae/semi-ui-svelte';
</script>

{#snippet camera()}
    <IconCamera />
{/snippet}

<div>
    <strong>默认状态：</strong>
    <Button aria-label="截屏" icon={camera} />
    <br />
    <br />
    <strong>禁用状态：</strong>
    <Button aria-label="截屏" disabled icon={camera} />
    <br />
    <br />
    <strong>复合类型：</strong>
    <span class="btn-margin-right">
        <Button aria-label="截屏" icon={camera} type="primary" />
        <Button aria-label="截屏" icon={camera} type="secondary" />
        <Button aria-label="截屏" icon={camera} type="warning" />
        <Button aria-label="截屏" icon={camera} type="danger" />
    </span>
    <br />
    <br />
    <strong>更改主题：</strong>
    <Button aria-label="截屏" icon={camera} style="margin-right: 10px" theme="solid" />
    <Button aria-label="截屏" icon={camera} theme="light" />
    <br />
    <br />
    <strong>更改图标位置：</strong>
    <Button style="margin-right: 10px" theme="solid">
        {#snippet icon()}
            <IconSidebar />
        {/snippet}
        收起
    </Button>
    <Button iconPosition="right" theme="solid">
        {#snippet icon()}
            <IconChevronDown />
        {/snippet}
        展开选项
    </Button>
    <br />
    <br />
</div>
