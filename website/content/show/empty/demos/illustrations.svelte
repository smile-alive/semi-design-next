<script lang="ts">
    import type { Component } from 'svelte';
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
    } from '@fibrae/semi-illustrations-svelte';
    import { Empty } from '@fibrae/semi-ui-svelte';

    type Illustration = Component<{ style?: string }>;

    const emptyStyle = 'padding: 30px';
    const imageStyle = 'width: 150px; height: 150px';
    const items: { Light: Illustration; Dark: Illustration; text: string }[] = [
        { Light: IllustrationSuccess, Dark: IllustrationSuccessDark, text: '创建成功' },
        { Light: IllustrationFailure, Dark: IllustrationFailureDark, text: '加载失败' },
        { Light: IllustrationNoAccess, Dark: IllustrationNoAccessDark, text: '没有权限' },
        { Light: IllustrationNoContent, Dark: IllustrationNoContentDark, text: '暂无内容，请添加' },
        { Light: IllustrationNotFound, Dark: IllustrationNotFoundDark, text: '页面404' },
        { Light: IllustrationNoResult, Dark: IllustrationNoResultDark, text: '搜索无结果' },
        { Light: IllustrationConstruction, Dark: IllustrationConstructionDark, text: '建设中' },
        { Light: IllustrationIdle, Dark: IllustrationIdleDark, text: '神游四方' },
    ];
</script>

<div style="display: flex; flex-wrap: wrap">
    {#each items as { Light, Dark, text } (text)}
        <Empty style={emptyStyle}>
            {#snippet image()}<Light style={imageStyle} />{/snippet}
            {#snippet darkModeImage()}<Dark style={imageStyle} />{/snippet}
            {#snippet description()}{text}{/snippet}
        </Empty>
    {/each}
</div>
