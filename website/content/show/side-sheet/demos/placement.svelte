<script lang="ts">
    import { Button, Radio, RadioGroup, SideSheet, type SideSheetProps } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    let placement = $state<SideSheetProps['placement']>('right');
</script>

<RadioGroup aria-label="侧边栏位置" onChange={(e) => (placement = e.target.value as SideSheetProps['placement'])} value={placement}>
    <Radio value="right">right</Radio>
    <Radio value="left">left</Radio>
    <Radio value="top">top</Radio>
    <Radio value="bottom">bottom</Radio>
</RadioGroup>
<br />
<br />
<Button onclick={() => (visible = !visible)}>Open SideSheet</Button>
<SideSheet bind:visible {placement} title="滑动侧边栏">
    <p>This is the content of a basic sidesheet.</p>
    <p>Here is more content...</p>
</SideSheet>
