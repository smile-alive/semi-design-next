<script lang="ts">
    import { Button, Feedback } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const onOk = () => {
        visible = false;
    };
    const radioGroupProps = { options: ['访客', '开发者', '维护者'] };
</script>

<Button onclick={() => (visible = !visible)}>展示反馈: Popup, radio</Button>
<Feedback bind:visible {onOk} {radioGroupProps} title="您的身份是" type="radio" />
