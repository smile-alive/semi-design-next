<script lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-svelte/illustrations';
    import { Button, Empty, Feedback, TextArea } from '@fibrae/semi-ui-svelte';

    const createState = () => ({ visible: false, value: '', showThanks: false });
    const popup = $state(createState());
    const modal = $state(createState());
    const showThankProps = { title: ' ', footer: null };

    // The thanks view stays 200ms past the close so the exit animation still shows it.
    const handleOk = (state: ReturnType<typeof createState>) => {
        state.showThanks = true;
        setTimeout(() => {
            state.visible = false;
            setTimeout(() => {
                state.showThanks = false;
            }, 200);
        }, 1500);
    };
</script>

{#snippet thanks()}
    <Empty style="padding: 30px">
        {#snippet image()}
            <IllustrationSuccess style="width: 150px; height: 150px" />
        {/snippet}
        {#snippet darkModeImage()}
            <IllustrationSuccessDark style="width: 150px; height: 150px" />
        {/snippet}
        {#snippet description()}感谢您的反馈{/snippet}
    </Empty>
{/snippet}

<div>
    <Button onclick={() => (popup.visible = !popup.visible)}>Open Feedback: Popup, Custom</Button>
    <Feedback bind:visible={popup.visible} okButtonProps={{ disabled: !popup.value }} onOk={() => handleOk(popup)} title="What is your feedback on this product?" type="custom" {...popup.showThanks ? showThankProps : {}}>
        {#if popup.showThanks}
            {@render thanks()}
        {:else}
            <span>这是一段自定义的内容</span>
            <TextArea bind:value={popup.value} />
        {/if}
    </Feedback>
    <br />
    <br />
    <Button onclick={() => (modal.visible = !modal.visible)}>Open Feedback: Modal, Custom</Button>
    <Feedback bind:visible={modal.visible} mode="modal" okButtonProps={{ disabled: !modal.value }} onOk={() => handleOk(modal)} title="What is your feedback on this product?" type="custom" {...modal.showThanks ? showThankProps : {}}>
        {#if modal.showThanks}
            {@render thanks()}
        {:else}
            <span>这是一段自定义的内容</span>
            <TextArea bind:value={modal.value} />
        {/if}
    </Feedback>
</div>
