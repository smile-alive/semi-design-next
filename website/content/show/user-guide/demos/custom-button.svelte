<script lang="ts">
    import { Button, Space, Switch, Tag, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#button-demo-1'),
            title: '新手引导',
            description: 'Hello ByteDancer!',
        },
        {
            target: () => document.querySelector('#button-demo-2'),
            title: 'New Button Style',
            description: 'Button text is Next',
        },
        {
            target: () => document.querySelector('#button-demo-3'),
            title: 'New finish button text',
            description: 'Button text is I know',
        },
    ];
</script>

<div>
    <Button onclick={() => (visible = true)}>开始引导</Button>
    <br />
    <br />
    <Space>
        <Switch aria-label="示例开关" checked id="button-demo-1" />
        <Tag id="button-demo-2">Default Tag</Tag>
        <Button id="button-demo-3">确定</Button>
    </Space>
    <UserGuide bind:visible finishText="我知道啦！" mask mode="popup" onFinish={() => console.log('引导完成')} onSkip={() => console.log('跳过引导')} prevButtonProps={{ theme: 'borderless' }} {steps}>
        {#snippet nextText()}Next{/snippet}
        {#snippet prevText()}Prev{/snippet}
    </UserGuide>
</div>
