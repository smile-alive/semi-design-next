<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
    import DropdownMenuFoundation, { type DropdownContextAdapter } from '@fibrae/semi-foundation/dropdown/menu-foundation';
    import type { ElementProps } from '../_base/element-props';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import { menuContext, useDropdownContext } from './context';
    import type { DropdownMenuProps, DropdownMenuSlots } from './interface';

    type Adapter = DropdownContextAdapter<DropdownMenuProps, Record<string, never>>;

    // Template attribute order matters: role and aria-orientation precede $attrs (overridable); keydown follows it.
    defineOptions({ inheritAttrs: false });
    const props = defineProps<DropdownMenuProps & /* @vue-ignore */ ElementProps<'ul', keyof DropdownMenuProps>>();
    defineSlots<DropdownMenuSlots>();

    const ctx = useDropdownContext();
    const config = useConfig();

    const { foundation } = useFoundation<DropdownMenuFoundation, Adapter, DropdownMenuProps, Record<string, never>>(
        DropdownMenuFoundation,
        props,
        () => ({}),
        () => ({}),
        { context: () => menuContext(ctx, config.value.direction) }
    );

    const onKeydown = (event: KeyboardEvent) => foundation.onMenuKeydown(event);
</script>

<template>
    <ul aria-orientation="vertical" :class="`${cssClasses.PREFIX}-menu`" role="menu" v-bind="$attrs" @keydown="onKeydown">
        <slot />
    </ul>
</template>
