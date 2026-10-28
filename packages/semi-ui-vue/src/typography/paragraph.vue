<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import slotNodes from '../_base/slot-nodes';
    import TypographyBase from './base.vue';
    import type { TypographyParagraphEmits, TypographyParagraphProps, TypographyParagraphSlots } from './interface';

    // A static subcomponent: it reads no global defaults, as in React.
    const props = withDefaults(defineProps<TypographyParagraphProps & /* @vue-ignore */ ElementProps<'p', keyof TypographyParagraphProps | EmitHandlers<TypographyParagraphEmits>>>(), {
        component: undefined,
        copyable: false,
        delete: false,
        disabled: false,
        ellipsis: false,
        link: false,
        mark: false,
        size: 'normal',
        spacing: 'normal',
        strong: false,
        type: 'primary',
        underline: false,
    });

    const emit = defineEmits<TypographyParagraphEmits>();
    const slots = defineSlots<TypographyParagraphSlots>();

    // default becomes the nodes prop; icon belongs to Text and Numeral only, as in React
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'default' && name !== 'icon');
</script>

<template>
    <TypographyBase v-bind="props" :class="`${cssClasses.PREFIX}-paragraph`" :component="props.component ?? 'p'" :nodes="slotNodes($slots.default?.() ?? [])" @copy="(...args) => emit('copy', ...args)" @expand="(...args) => emit('expand', ...args)">
        <template v-for="name in passedSlots()" #[name]="scope">
            <slot :name="name as keyof TypographyParagraphSlots" v-bind="scope" />
        </template>
    </TypographyBase>
</template>
