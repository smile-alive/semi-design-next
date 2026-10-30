<script lang="ts">
    import { Button, Steps } from '@fibrae/semi-ui-svelte';

    const steps = [
        { title: 'First', content: 'First-content' },
        { title: 'Second', content: 'Second-content' },
        { title: 'Last', content: 'Last-content' },
    ];
    let current = $state(0);
    const log = (i: number) => console.log(i);
    const done = () => console.log('Processing complete!');
</script>

<div>
    <Steps {current} dataSource={steps} onChange={log} type="basic" />
    <div class="steps-content" style="margin-top: 4px; margin-bottom: 4px">
        {steps[current].content}
    </div>
    <div class="steps-action">
        {#if current < steps.length - 1}
            <Button type="primary" onclick={() => (current += 1)}>Next</Button>
        {/if}
        {#if current === steps.length - 1}
            <Button type="primary" onclick={done}>Done</Button>
        {/if}
        {#if current > 0}
            <Button style="margin-left: 8px" onclick={() => (current -= 1)}>Previous</Button>
        {/if}
    </div>
</div>
