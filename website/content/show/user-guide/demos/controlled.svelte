<script lang="ts">
    import { Button, Space, Switch, Tag, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    let current = $state(0);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#controlled-demo-1'),
            title: '新手引导',
            description: 'Hello ByteDancer!',
            position: 'bottom',
        },
        {
            target: () => document.querySelector('#controlled-demo-2'),
            title: 'Switch',
            description: 'This is a Semi Switch',
            position: 'bottom',
        },
        {
            target: () => document.querySelector('#controlled-demo-3'),
            title: 'Button',
            description: 'This is a Semi Button',
            position: 'bottom',
        },
    ];

    const finish = (message: string) => {
        current = 0;
        console.log(message);
    };
</script>

<div>
    <Button onclick={() => (visible = true)}>开始引导</Button>
    <br />
    <br />
    <Space>
        <Switch aria-label="示例开关" checked id="controlled-demo-1" />
        <Tag id="controlled-demo-2">Default Tag</Tag>
        <Button id="controlled-demo-3">确定</Button>
    </Space>
    <UserGuide bind:current bind:visible mask mode="popup" onFinish={() => finish('引导完成')} onSkip={() => finish('跳过引导')} {steps} />
</div>
