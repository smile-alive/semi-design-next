<script lang="ts">
    import { Button, DatePicker, Space } from '@fibrae/semi-ui-svelte';

    let picker = $state<ReturnType<typeof DatePicker>>();

    const handleClickOutside = () => {
        console.log('click outside');
    };
</script>

<Space align="start" vertical>
    <Space>
        <Button onclick={() => picker?.open()}>open</Button>
        <Button onclick={() => picker?.close()}>close</Button>
        <Button onclick={() => picker?.focus()}>focus</Button>
        <Button onclick={() => picker?.blur()}>blur</Button>
    </Space>
    <div>
        <DatePicker bind:this={picker} onClickOutSide={handleClickOutside} type="dateTime" />
    </div>
</Space>
