<script setup lang="ts">
    import { computed, type StyleValue } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/space/constants';
    import '@fibrae/semi-foundation/space/space.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault from '../_base/semi-default';
    import type { SpaceProps, SpaceSlots, Spacing } from './interface';

    const props = withDefaults(defineProps<SpaceProps & /* @vue-ignore */ ElementProps<'div', keyof SpaceProps>>(), {
        wrap: () => semiDefault('Space', 'wrap', false),
        align: () => semiDefault('Space', 'align', 'center'),
        vertical: () => semiDefault('Space', 'vertical', false),
        spacing: () => semiDefault('Space', 'spacing', 'tight'),
    });

    defineSlots<SpaceSlots>();

    const prefixCls = cssClasses.PREFIX;
    const presets: string[] = [strings.SPACING_TIGHT, strings.SPACING_MEDIUM, strings.SPACING_LOOSE];

    // A preset becomes a class; a number becomes a gap in px, which Vue (unlike React) does not append itself.
    const axes = computed(() => {
        const [horizontal, vertical]: (Spacing | undefined)[] = Array.isArray(props.spacing) ? props.spacing : [props.spacing, props.spacing];
        const gap = (value?: Spacing) => (typeof value === 'number' ? `${value}px` : undefined);
        return {
            horizontal: typeof horizontal === 'string' ? horizontal : undefined,
            vertical: typeof vertical === 'string' ? vertical : undefined,
            style: { columnGap: gap(horizontal), rowGap: gap(vertical) } satisfies StyleValue,
        };
    });
</script>

<template>
    <div
        :class="[
            prefixCls,
            `${prefixCls}-align-${props.align}`,
            props.vertical ? `${prefixCls}-vertical` : `${prefixCls}-horizontal`,
            { [`${prefixCls}-wrap`]: props.wrap && !props.vertical, [`${prefixCls}-${axes.horizontal}-horizontal`]: axes.horizontal && presets.includes(axes.horizontal), [`${prefixCls}-${axes.vertical}-vertical`]: axes.vertical && presets.includes(axes.vertical) },
        ]"
        :style="axes.style"
        x-semi-prop="children"
    >
        <slot />
    </div>
</template>
