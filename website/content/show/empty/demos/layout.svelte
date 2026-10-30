<script lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-svelte';
    import { Button, Empty } from '@fibrae/semi-ui-svelte';

    const imageStyle = 'width: 150px; height: 150px';
</script>

{#snippet image()}<IllustrationSuccess style={imageStyle} />{/snippet}
{#snippet darkModeImage()}<IllustrationSuccessDark style={imageStyle} />{/snippet}

<Empty {darkModeImage} {image} layout="horizontal" style="width: 800px; margin: 0 auto" title="创建成功">
    {#snippet description()}这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。{/snippet}
    <Button style="padding: 6px 24px" theme="solid" type="primary">开始操作</Button>
</Empty>
