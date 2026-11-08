<script lang="ts">
    import {
        IllustrationConstruction,
        IllustrationConstructionDark,
        IllustrationFailure,
        IllustrationFailureDark,
        IllustrationIdle,
        IllustrationIdleDark,
        IllustrationNoAccess,
        IllustrationNoAccessDark,
        IllustrationNoContent,
        IllustrationNoContentDark,
        IllustrationNotFound,
        IllustrationNotFoundDark,
        IllustrationNoResult,
        IllustrationNoResultDark,
        IllustrationSuccess,
        IllustrationSuccessDark,
    } from '@fibrae/semi-icons-svelte/illustrations';
    import { Empty } from '@fibrae/semi-ui-svelte';

    const emptyStyle = 'padding: 30px';
    const imageStyle = 'width: 150px; height: 150px';
</script>

<div style="display: flex; flex-wrap: wrap">
    <Empty style={emptyStyle}>
        {#snippet image()}<IllustrationSuccess style={imageStyle} />{/snippet}
        {#snippet darkModeImage()}<IllustrationSuccessDark style={imageStyle} />{/snippet}
        {#snippet description()}创建成功{/snippet}
    </Empty>
    <Empty style={emptyStyle}>
        {#snippet image()}<IllustrationFailure style={imageStyle} />{/snippet}
        {#snippet darkModeImage()}<IllustrationFailureDark style={imageStyle} />{/snippet}
        {#snippet description()}加载失败{/snippet}
    </Empty>
    <Empty style={emptyStyle}>
        {#snippet image()}<IllustrationNoAccess style={imageStyle} />{/snippet}
        {#snippet darkModeImage()}<IllustrationNoAccessDark style={imageStyle} />{/snippet}
        {#snippet description()}没有权限{/snippet}
    </Empty>
    <Empty style={emptyStyle}>
        {#snippet image()}<IllustrationNoContent style={imageStyle} />{/snippet}
        {#snippet darkModeImage()}<IllustrationNoContentDark style={imageStyle} />{/snippet}
        {#snippet description()}暂无内容，请添加{/snippet}
    </Empty>
    <Empty style={emptyStyle}>
        {#snippet image()}<IllustrationNotFound style={imageStyle} />{/snippet}
        {#snippet darkModeImage()}<IllustrationNotFoundDark style={imageStyle} />{/snippet}
        {#snippet description()}页面404{/snippet}
    </Empty>
    <Empty style={emptyStyle}>
        {#snippet image()}<IllustrationNoResult style={imageStyle} />{/snippet}
        {#snippet darkModeImage()}<IllustrationNoResultDark style={imageStyle} />{/snippet}
        {#snippet description()}搜索无结果{/snippet}
    </Empty>
    <Empty style={emptyStyle}>
        {#snippet image()}<IllustrationConstruction style={imageStyle} />{/snippet}
        {#snippet darkModeImage()}<IllustrationConstructionDark style={imageStyle} />{/snippet}
        {#snippet description()}建设中{/snippet}
    </Empty>
    <Empty style={emptyStyle}>
        {#snippet image()}<IllustrationIdle style={imageStyle} />{/snippet}
        {#snippet darkModeImage()}<IllustrationIdleDark style={imageStyle} />{/snippet}
        {#snippet description()}神游四方{/snippet}
    </Empty>
</div>
