<script lang="ts">
    import { Button, SideSheet, TextArea } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    let value = $state('');
</script>

<Button onclick={() => (visible = true)}>Open SideSheet</Button>
<TextArea bind:value placeholder="Please enter something" style="margin-top: 12px" />
<SideSheet bind:visible disableScroll={false} mask={false} title="可操作外部的侧边栏">
    <p>这里是输入的内容：</p>
    <p>{value}</p>
</SideSheet>
