<script setup lang="ts">
    import { computed } from 'vue';
    import { strings } from '@fibrae/semi-foundation/typography/constants';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import slotNodes from '../_base/slot-nodes';
    import TypographyBase from './base.vue';
    import type { TypographyTitleEmits, TypographyTitleProps, TypographyTitleSlots } from './interface';

    // A static subcomponent: it reads no global defaults, as in React.
    const props = withDefaults(defineProps<TypographyTitleProps & /* @vue-ignore */ ElementProps<'h1', keyof TypographyTitleProps | EmitHandlers<TypographyTitleEmits>>>(), {
        component: undefined,
        copyable: false,
        delete: false,
        disabled: false,
        ellipsis: false,
        heading: 1,
        link: false,
        mark: false,
        strong: false,
        type: 'primary',
        underline: false,
        weight: undefined,
    });

    const emit = defineEmits<TypographyTitleEmits>();
    const slots = defineSlots<TypographyTitleSlots>();

    const headingTag = computed(() => (strings.HEADING.includes(props.heading) ? (`h${props.heading}` as const) : 'h1'));

    const baseProps = computed(() => {
        const { heading: _heading, ...rest } = props;
        return { ...rest, component: props.component ?? headingTag.value, headingTag: headingTag.value };
    });

    // default becomes the nodes prop; icon belongs to Text and Numeral only, as in React
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'default' && name !== 'icon');
</script>

<template>
    <TypographyBase v-bind="baseProps" :nodes="slotNodes($slots.default?.() ?? [])" @copy="(...args) => emit('copy', ...args)" @expand="(...args) => emit('expand', ...args)">
        <template v-for="name in passedSlots()" #[name]="scope">
            <slot :name="name as keyof TypographyTitleSlots" v-bind="scope" />
        </template>
    </TypographyBase>
</template>
