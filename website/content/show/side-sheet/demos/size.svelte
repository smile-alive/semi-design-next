<script lang="ts">
    import { Button, Radio, RadioGroup, SideSheet, type SideSheetProps } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    let size = $state<SideSheetProps['size']>('small');
</script>

<RadioGroup aria-label="侧边栏尺寸" onChange={(e) => (size = e.target.value as SideSheetProps['size'])} value={size}>
    <Radio value="small">small</Radio>
    <Radio value="medium">medium</Radio>
    <Radio value="large">large</Radio>
</RadioGroup>
<br />
<br />
<Button onclick={() => (visible = !visible)}>Open SideSheet</Button>
<SideSheet bind:visible {size} title="滑动侧边栏">
    <p>This is the content of a basic sidesheet.</p>
    <p>Here is more content...</p>
</SideSheet>
