<script lang="ts">
    import Modal from '../../modal/modal.svelte';
    import Popover from '../../popover/popover.svelte';
    import type { TooltipTriggerProps } from '../../tooltip';
    import Tag from '../tag.svelte';
</script>

{#snippet content()}<div>浮层内容</div>{/snippet}

{#snippet child({ props }: { props: TooltipTriggerProps })}
    <Tag {...props} onclick={() => {}}>李白</Tag>
{/snippet}

<Modal motion={false} title="对话框" visible>
    <Popover {child} {content} motion={false} trigger="click">trigger</Popover>
</Modal>
