<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
    import { getDropdownContext } from './context.js';
    import type { DropdownTitleProps } from './interface.js';

    let { children, ...rest }: DropdownTitleProps = $props();

    const ctx = getDropdownContext();

    const prefix = cssClasses.PREFIX;
</script>

<!-- A child of the menu ul, which accepts only li; presentation keeps it out of the menu's items. -->
<li {...rest} class={[`${prefix}-title`, rest.class, { [`${prefix}-title-withTick`]: ctx?.view.showTick }]} role="presentation">
    {@render children?.()}
</li>
