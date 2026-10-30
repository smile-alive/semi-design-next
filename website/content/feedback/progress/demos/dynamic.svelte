<script lang="ts">
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import { Button, Progress } from '@fibrae/semi-ui-svelte';

    let percent = $state(40);
</script>

<div>
    <Progress aria-label="disk usage" {percent} showInfo />
    <Button aria-label="减少" disabled={percent === 0} theme="light" onclick={() => (percent -= 10)}>
        {#snippet icon()}
            <IconChevronLeft />
        {/snippet}
    </Button>
    <Button aria-label="增加" disabled={percent >= 100} theme="light" onclick={() => (percent += 10)}>
        {#snippet icon()}
            <IconChevronRight />
        {/snippet}
    </Button>
</div>
