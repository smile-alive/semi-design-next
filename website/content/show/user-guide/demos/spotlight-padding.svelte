<script lang="ts">
    import { Button, Space, Switch, Tag, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#padding-demo-1'),
            title: '新手引导',
            description: 'Hello ByteDancer!',
        },
        {
            target: () => document.querySelector('#padding-demo-2'),
            title: 'New Padding',
            description: 'This is 10px padding',
        },
        {
            target: () => document.querySelector('#padding-demo-3'),
            title: 'Change Padding',
            spotlightPadding: 15,
            description: 'We change the Padding to 15px',
        },
    ];
</script>

<div>
    <Button onclick={() => (visible = true)}>开始引导</Button>
    <br />
    <br />
    <Space>
        <Switch aria-label="示例开关" checked id="padding-demo-1" />
        <Tag id="padding-demo-2">Default Tag</Tag>
        <Button id="padding-demo-3">确定</Button>
    </Space>
    <UserGuide bind:visible mask mode="popup" onFinish={() => console.log('引导完成')} onSkip={() => console.log('跳过引导')} spotlightPadding={10} {steps} />
</div>
