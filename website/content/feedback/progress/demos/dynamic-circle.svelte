<script lang="ts">
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import { Button, Progress } from '@fibrae/semi-ui-svelte';

    let cirPerc = $state(40);
</script>

<div>
    <div>
        <Progress aria-label="disk usage" percent={cirPerc} type="circle" />
    </div>
    <Button aria-label="减少" disabled={cirPerc === 0} theme="light" onclick={() => (cirPerc -= 10)}>
        {#snippet icon()}
            <IconChevronLeft />
        {/snippet}
    </Button>
    <Button aria-label="增加" disabled={cirPerc >= 100} theme="light" onclick={() => (cirPerc += 10)}>
        {#snippet icon()}
            <IconChevronRight />
        {/snippet}
    </Button>
</div>
