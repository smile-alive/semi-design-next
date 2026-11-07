<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { UserGuideStepItem } from '../interface';
    import UserGuide from '../user-guide.svelte';

    let { steps, mode, ownContainer }: { steps: UserGuideStepItem[]; mode?: 'popup' | 'modal'; ownContainer?: () => HTMLElement } = $props();

    let container = $state<HTMLDivElement>();
</script>

<div bind:this={container} class="config-container"></div>
<ConfigProvider getPopupContainer={() => container as HTMLDivElement}>
    <UserGuide getPopupContainer={ownContainer} {mode} {steps} visible />
</ConfigProvider>
