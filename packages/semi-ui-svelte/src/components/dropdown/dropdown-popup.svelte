<script lang="ts">
    import { onMount, type Snippet } from 'svelte';
    import type { FocusTarget, RenderContentProps } from '../tooltip/index.js';
    import { type DropdownContext, setDropdownContext } from './context.js';

    interface Props {
        context: DropdownContext;
        prefixCls: string;
        contentClass?: string;
        style?: string;
        initialFocusRef: RenderContentProps['initialFocusRef'];
        focusTarget: FocusTarget;
        children?: Snippet;
    }

    let { context, prefixCls, contentClass, style, initialFocusRef, focusTarget, children }: Props = $props();

    // Set here, not in Dropdown: the trigger renders under Dropdown too and must read the enclosing menu's context
    setDropdownContext(context);

    onMount(() => initialFocusRef(focusTarget));
</script>

<div class={[prefixCls, contentClass]} {style}>
    <div class={`${prefixCls}-content`} x-semi-prop="content">
        {@render children?.()}
    </div>
</div>
