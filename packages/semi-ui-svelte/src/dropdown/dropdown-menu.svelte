<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
    import DropdownMenuFoundation, { type DropdownContextAdapter } from '@fibrae/semi-foundation/dropdown/menu-foundation';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import { getDropdownContext, menuContext } from './context.js';
    import type { DropdownMenuProps } from './interface.js';

    type Adapter = DropdownContextAdapter<DropdownMenuProps, Record<string, never>>;

    let { children, ...rest }: DropdownMenuProps = $props();

    const ctx = getDropdownContext();
    const config = getConfigContext();

    const { foundation } = useFoundation<DropdownMenuFoundation, Adapter, DropdownMenuProps, Record<string, never>>(
        DropdownMenuFoundation,
        {},
        () => ({}),
        () => ({}),
        { context: () => menuContext(ctx, config.direction) }
    );

    const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLUListElement }) => {
        // the caller's listener goes first, so it can read the focus the keydown has not moved yet
        rest.onkeydown?.(event);
        foundation.onMenuKeydown(event);
    };
</script>

<!-- role and aria-orientation precede the spread so the caller can override them -->
<ul aria-orientation="vertical" role="menu" {...rest} class={[`${cssClasses.PREFIX}-menu`, rest.class]} onkeydown={handleKeyDown}>
    {@render children?.()}
</ul>
