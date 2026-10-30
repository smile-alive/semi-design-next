<script lang="ts">
    import { Button, Feedback, type FeedbackValue } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const onOk = () => {
        visible = false;
    };
    const onValueChange = (value: FeedbackValue) => {
        console.log('emoji value', value);
    };
</script>

<Button onclick={() => (visible = !visible)}>展示反馈: Modal, emoji</Button>
<Feedback bind:visible mode="modal" {onOk} {onValueChange} title="Why did you choose this rating?" />
