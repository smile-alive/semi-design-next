<script lang="ts">
    import { Button, Feedback } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const onOk = () => {
        visible = false;
    };
    const checkboxGroupProps = { options: ['抖音', '火山', '豆包'] };
</script>

<Button onclick={() => (visible = !visible)}>展示反馈: Popup, checkbox</Button>
<Feedback bind:visible {checkboxGroupProps} {onOk} title="您最常使用以下哪些产品？" type="checkbox" />
