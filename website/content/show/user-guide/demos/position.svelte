<script lang="ts">
    import { Button, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const target = () => document.querySelector('#position-demo');
    const steps: UserGuideStepItem[] = [
        { target, title: '新手引导', description: 'Hello ByteDancer!', position: 'top' },
        { target, title: 'New Position', description: 'This is Right Position', position: 'right' },
        { target, title: 'Hide Arrow', description: 'We hide the arrow', position: 'bottom', showArrow: false },
    ];
</script>

<div>
    <Button id="position-demo" onclick={() => (visible = true)}>开始引导</Button>
    <UserGuide bind:visible mask mode="popup" onFinish={() => console.log('引导完成')} onSkip={() => console.log('跳过引导')} {steps} />
</div>
