<script lang="ts">
    import { Button, TimePicker } from '@fibrae/semi-ui-svelte';

    let open = $state(false);
    const closePanel = () => {
        open = false;
    };
    const onOpenChange = (value: boolean) => {
        console.log(value);
    };
    const logFooter = (text: string) => console.log(text);
</script>

<div>
    <TimePicker bind:open {onOpenChange}>
        {#snippet panelHeader()}Time Select{/snippet}
        {#snippet panelFooter()}
            <Button onclick={closePanel}>close</Button>
        {/snippet}
    </TimePicker>
    <br />
    <br />
    <TimePicker type="timeRange">
        {#snippet panelHeader({ index })}{index === 0 ? 'start header' : 'end header'}{/snippet}
        {#snippet panelFooter({ index })}
            {#if index === 0}
                <Button onclick={() => logFooter('start footer')}>start footer</Button>
            {:else}
                <Button onclick={() => logFooter('end footer')}>end footer</Button>
            {/if}
        {/snippet}
    </TimePicker>
</div>
