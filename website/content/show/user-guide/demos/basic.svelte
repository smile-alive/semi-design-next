<script lang="ts">
    import { Button, Space, Switch, Tag, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#basic-demo-1'),
            title: '新手引导',
            description: 'Hello ByteDancer!',
            position: 'bottom',
        },
        {
            target: () => document.querySelector('#basic-demo-2'),
            title: 'Switch',
            description: 'This is a Semi Switch',
            position: 'bottom',
        },
        {
            target: () => document.querySelector('#basic-demo-3'),
            title: 'Button',
            description: 'This is a Semi Button',
            position: 'bottom',
        },
    ];
</script>

<div>
    <Button onclick={() => (visible = true)}>开始引导</Button>
    <br />
    <br />
    <Space>
        <Switch aria-label="示例开关" checked id="basic-demo-1" />
        <Tag id="basic-demo-2">Default Tag</Tag>
        <Button id="basic-demo-3">确定</Button>
    </Space>
    <UserGuide bind:visible mask mode="popup" onChange={(current) => console.log('当前引导步骤', current)} onFinish={() => console.log('引导完成')} onNext={() => console.log('下一步引导')} onPrev={() => console.log('上一步引导')} onSkip={() => console.log('跳过引导')} {steps} />
</div>
