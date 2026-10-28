<script setup lang="ts">
    import { computed } from 'vue';
    import FormatNumeral from '@fibrae/semi-foundation/typography/format-numeral';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import slotNodes from '../_base/slot-nodes';
    import TypographyBase from './base.vue';
    import type { TypographyNumeralEmits, TypographyNumeralProps, TypographyNumeralSlots } from './interface';

    // A static subcomponent: it reads no global defaults, as in React.
    const props = withDefaults(defineProps<TypographyNumeralProps & /* @vue-ignore */ ElementProps<'span', keyof TypographyNumeralProps | EmitHandlers<TypographyNumeralEmits>>>(), {
        component: undefined,
        code: false,
        copyable: false,
        delete: false,
        disabled: false,
        link: false,
        mark: false,
        parser: undefined,
        precision: 0,
        rule: 'text',
        size: 'normal',
        strong: false,
        truncate: 'round',
        type: 'primary',
        underline: false,
    });

    const emit = defineEmits<TypographyNumeralEmits>();
    const slots = defineSlots<TypographyNumeralSlots>();

    const baseProps = computed(() => {
        const { parser, precision, rule, truncate, ...rest } = props;
        return {
            ...rest,
            component: props.component ?? 'span',
            format: (value: string) => new FormatNumeral(value, rule, precision, truncate, parser).format(),
        };
    });

    // default becomes the nodes prop; an `ellipsis` attr falls through to TypographyBase, which would then render the
    // ellipsis slots Numeral does not declare
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'default' && name !== 'ellipsisContent' && name !== 'ellipsisTooltip');
</script>

<template>
    <TypographyBase v-bind="baseProps" :nodes="slotNodes($slots.default?.() ?? [])" @copy="(...args) => emit('copy', ...args)">
        <template v-for="name in passedSlots()" #[name]="scope">
            <slot :name="name as keyof TypographyNumeralSlots" v-bind="scope" />
        </template>
    </TypographyBase>
</template>
