<script setup lang="ts">
    import { computed, onUpdated, useSlots, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/spin/constants';
    import SpinFoundation, { type SpinAdapter, type SpinState } from '@fibrae/semi-foundation/components/spin/foundation';
    import '@fibrae/semi-foundation/components/spin/spin.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import useLocale from '../locale/use-locale';
    import SpinIcon from './icon.vue';
    import type { SpinProps, SpinSlots } from './interface';

    type Foundation = SpinFoundation<SpinProps>;
    type Adapter = SpinAdapter<SpinProps>;

    const props = withDefaults(defineProps<SpinProps & /* @vue-ignore */ ElementProps<'div', keyof SpinProps>>(), {
        size: () => semiDefault('Spin', 'size', 'middle'),
        spinning: () => semiDefault('Spin', 'spinning', true),
        delay: () => semiDefault('Spin', 'delay', 0),
        wrapperClassName: semiGlobalDefault('Spin', 'wrapperClassName'),
        childStyle: semiGlobalDefault('Spin', 'childStyle'),
    });

    defineSlots<SpinSlots>();
    const slots = useSlots();

    const locale = useLocale('Spin');

    const root = useTemplateRef<HTMLElement>('root');

    const { foundation, state } = useFoundation<Foundation, Adapter, SpinProps, SpinState>(
        SpinFoundation,
        props,
        (view) => SpinFoundation.getInitialState(view),
        () => ({})
    );

    const loading = computed(() => (props.delay ? state.value.loading : props.spinning));
    const prefixCls = cssClasses.PREFIX;

    const isBlocked = () => Boolean(loading.value && slots.default);

    let wasBlocked = isBlocked();

    // The slot can change without `loading` changing, so this follows the rendered result instead of watching `loading`.
    onUpdated(() => {
        const blocked = isBlocked();
        if (blocked === wasBlocked) {
            return;
        }
        wasBlocked = blocked;
        foundation.handleBlockedChange(root.value as HTMLElement, blocked);
    });
</script>

<template>
    <div
        ref="root"
        :aria-busy="isBlocked() ? true : undefined"
        :class="[
            prefixCls,
            props.wrapperClassName,
            {
                [`${prefixCls}-${props.size}`]: props.size,
                [`${prefixCls}-block`]: $slots.default,
                [`${prefixCls}-hidden`]: !loading,
            },
        ]"
        :tabindex="isBlocked() ? -1 : undefined"
    >
        <output v-if="loading" :aria-label="locale.locale.loading" :class="`${prefixCls}-wrapper`">
            <div v-if="$slots.indicator" :class="`${prefixCls}-animate`" x-semi-prop="indicator">
                <slot name="indicator" />
            </div>
            <SpinIcon v-else />
            <div v-if="$slots.tip" x-semi-prop="tip">
                <slot name="tip" />
            </div>
        </output>
        <div :class="`${prefixCls}-children`" :inert="isBlocked()" :style="props.childStyle" x-semi-prop="children">
            <slot />
        </div>
    </div>
</template>
