<script setup lang="ts">
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import slotNodes from '../_base/slot-nodes';
    import TypographyBase from './base.vue';
    import type { TypographyTextEmits, TypographyTextProps, TypographyTextSlots } from './interface';

    // A static subcomponent: it reads no global defaults, as in React.
    const props = withDefaults(defineProps<TypographyTextProps & /* @vue-ignore */ ElementProps<'span', keyof TypographyTextProps | EmitHandlers<TypographyTextEmits>>>(), {
        component: undefined,
        code: false,
        copyable: false,
        delete: false,
        disabled: false,
        ellipsis: false,
        link: false,
        mark: false,
        size: 'normal',
        strong: false,
        type: 'primary',
        underline: false,
        weight: undefined,
    });

    const emit = defineEmits<TypographyTextEmits>();
    const slots = defineSlots<TypographyTextSlots>();

    // default becomes the nodes prop; the rest are forwarded only when given, as TypographyBase reads whether they exist
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'default');
</script>

<template>
    <TypographyBase v-bind="props" :component="props.component ?? 'span'" :nodes="slotNodes($slots.default?.() ?? [])" @copy="(...args) => emit('copy', ...args)" @expand="(...args) => emit('expand', ...args)">
        <template v-for="name in passedSlots()" #[name]="scope">
            <slot :name="name as keyof TypographyTextSlots" v-bind="scope" />
        </template>
    </TypographyBase>
</template>
