<script lang="ts">
    import { Button, Steps } from '@fibrae/semi-ui-svelte';

    const steps = [
        { title: 'First', content: 'First-content' },
        { title: 'Second', content: 'Second-content' },
        { title: 'Last', content: 'Last-content' },
    ];
    let current = $state(0);
    const next = () => {
        current += 1;
    };
    const prev = () => {
        current -= 1;
    };
    const log = (i: number) => console.log(i);
    const done = () => console.log('Processing complete!');
</script>

<div>
    <Steps {current} dataSource={steps} onChange={log} type="basic" />
    <div class="steps-content" style="margin-block-start: 4px; margin-block-end: 4px">
        {steps[current].content}
    </div>
    <div class="steps-action">
        {#if current < steps.length - 1}
            <Button type="primary" onclick={next}>Next</Button>
        {/if}
        {#if current === steps.length - 1}
            <Button type="primary" onclick={done}>Done</Button>
        {/if}
        {#if current > 0}
            <Button style="margin-inline-start: 8px" onclick={prev}>Previous</Button>
        {/if}
    </div>
</div>
