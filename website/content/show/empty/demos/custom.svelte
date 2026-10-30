<script lang="ts">
    import { IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-svelte';
    import { Button, Empty } from '@fibrae/semi-ui-svelte';

    const imageStyle = 'width: 150px; height: 150px';
</script>

{#snippet image()}<IllustrationNoContent style={imageStyle} />{/snippet}
{#snippet darkModeImage()}<IllustrationNoContentDark style={imageStyle} />{/snippet}

<Empty {darkModeImage} {image} title="空状态标题">
    {#snippet description()}开始创建你的第一个仪表盘吧！{/snippet}
    <div>
        <Button style="padding: 6px 24px; margin-right: 12px" type="primary">二级按钮</Button>
        <Button style="padding: 6px 24px" theme="solid" type="primary">一级按钮</Button>
    </div>
</Empty>
