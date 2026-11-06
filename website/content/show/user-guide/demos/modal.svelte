<script lang="ts">
    import { Button, Image, Typography, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const covers = ['/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];
    const steps: UserGuideStepItem[] = [
        { title: '欢迎使用 Semi DSM!', description: welcome, cover, position: 'bottom' },
        { title: '高可用的色盘', description: '选取主色后，我们的颜色算法会为你生成一套高可用的色盘', cover, position: 'bottom' },
        { title: '自由定制', description: '开始定制属于你的设计系统吧！', cover, position: 'bottom' },
    ];
</script>

{#snippet welcome()}
    <div>你可以从已发布的主题出发，或者选择<Typography.Text strong>立即创造</Typography.Text>来创造一个新的主题</div>
{/snippet}

{#snippet cover(renderProps: { index: number })}
    <Image height="100%" src={covers[renderProps.index]} width="600px" />
{/snippet}

<div>
    <Button onclick={() => (visible = true)}>开始引导</Button>
    <UserGuide bind:visible mask mode="modal" onChange={(current) => console.log('当前引导步骤', current)} onFinish={() => console.log('引导完成')} onNext={() => console.log('下一步引导')} onPrev={() => console.log('上一步引导')} onSkip={() => console.log('跳过引导')} {steps} />
</div>
