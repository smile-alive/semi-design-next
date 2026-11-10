<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import FormatNumeral from '@fibrae/semi-foundation/components/typography/format-numeral';
    import type { ElementProps, EmitHandlers } from '../../base/index';
    import { slotNodes } from '../../utils/index';
    import TypographyBase from './base.vue';
    import type { TypographyNumeralEmits, TypographyNumeralProps, TypographyNumeralSlots } from './interface';

    // Fallthrough attrs would override a prop set in the template, so they are forwarded by hand (see binding).
    defineOptions({ inheritAttrs: false });

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
    const attrs = useAttrs();

    const baseProps = computed(() => {
        const { parser, precision, rule, truncate, ...rest } = props;
        return {
            ...rest,
            component: props.component ?? 'span',
            format: (value: string) => new FormatNumeral(value, rule, precision, truncate, parser).format(),
        };
    });

    // Numeral declares no ellipsis: one passed as an attr must not truncate a formatted number
    const binding = () => ({ ...attrs, ...baseProps.value, ellipsis: false });

    // default becomes the nodes prop
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'default');
</script>

<template>
    <TypographyBase v-bind="binding()" :nodes="slotNodes($slots.default?.() ?? [])" @copy="(...args) => emit('copy', ...args)">
        <template v-for="name in passedSlots()" #[name]="scope">
            <slot :name="name as keyof TypographyNumeralSlots" v-bind="scope" />
        </template>
    </TypographyBase>
</template>
