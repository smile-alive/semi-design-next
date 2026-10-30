<script lang="ts">
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import { Button, Progress } from '@fibrae/semi-ui-svelte';

    let percent = $state(10);
    const strokeArr = [
        { percent: 20, color: 'red' },
        { percent: 40, color: 'orange-9' },
        { percent: 60, color: 'light-green-8' },
        { percent: 80, color: 'hsla(125, 50%, 46%, 1)' },
    ];
</script>

<div>
    <Progress aria-label="disk usage" {percent} showInfo stroke={strokeArr} type="circle" width={100} />
    <Progress aria-label="disk usage" {percent} showInfo stroke={strokeArr} style="margin: 20px 0 10px" />
</div>
<Button aria-label="Decrease" disabled={percent === 0} theme="light" onclick={() => (percent -= 10)}>
    {#snippet icon()}
        <IconChevronLeft />
    {/snippet}
</Button>
<Button aria-label="Increase" disabled={percent === 100} theme="light" onclick={() => (percent += 10)}>
    {#snippet icon()}
        <IconChevronRight />
    {/snippet}
</Button>
