<script lang="ts">
    import { Button, UserGuide, type UserGuideStepItem } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const steps: UserGuideStepItem[] = [
        {
            target: () => document.querySelector('#mask-demo'),
            title: 'No Mask',
            description: 'Hello ByteDancer!',
        },
    ];
</script>

<div>
    <Button id="mask-demo" onclick={() => (visible = true)}>开始引导</Button>
    <UserGuide bind:visible mask={false} mode="popup" onFinish={() => console.log('引导完成')} onSkip={() => console.log('跳过引导')} {steps} />
</div>
