<script setup lang="ts">
    import { toRaw, useAttrs, useTemplateRef } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/lottie/constants';
    import LottieFoundation, { type LottieAdapter, type LottieBaseProps, type LottieBaseState } from '@fibrae/semi-foundation/lottie/foundation';
    import { isDev } from '@fibrae/semi-foundation/utils/warning';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { semiGlobalDefault } from '../_base/semi-default';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import useKeepAliveFoundation from '../_base/use-keep-alive-foundation';
    import type { LottieEmits, LottieProps } from './interface';

    type Foundation = LottieFoundation<LottieBaseProps, LottieBaseState>;
    type Adapter = LottieAdapter<LottieBaseProps, LottieBaseState>;

    const props = withDefaults(defineProps<LottieProps & /* @vue-ignore */ ElementProps<'div', keyof LottieProps | EmitHandlers<LottieEmits>>>(), {
        height: semiGlobalDefault('Lottie', 'height'),
        width: semiGlobalDefault('Lottie', 'width'),
    });

    const emit = defineEmits<LottieEmits>();
    const attrs = useAttrs();

    const wrapper = useTemplateRef('wrapper');

    const { foundation } = useFoundation<Foundation, Adapter, LottieBaseProps, LottieBaseState>(
        LottieFoundation,
        props,
        () => ({}),
        () => ({
            getContainer: () => wrapper.value,
            notifyLoadError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        }),
        {
            props: {
                // lottie-web mutates the animation data, so it must not be a reactive proxy
                params: () => toRaw(props.params),
                getAnimationInstance: () => (animation) => emit('getAnimationInstance', animation),
                getLottie: () => (lottie) => emit('getLottie', lottie),
            },
        }
    );

    const prefix = cssClasses.PREFIX;

    // a named animation is an image; an unnamed one is decoration
    const named = () => Boolean(attrs['aria-label'] || attrs['aria-labelledby']);

    useKeepAliveFoundation(foundation);

    // Known limit: the watch follows the reference, so mutating `params` in place does not reload. Upgrade: compare a
    // shallow snapshot of `params` if that use becomes common.
    useDidUpdate(
        () => props.params,
        () => foundation.handleParamsUpdate(),
        (a, b) => isEqual(toRaw(a), toRaw(b))
    );
</script>

<template>
    <div v-if="!props.params.container" ref="wrapper" :aria-hidden="named() ? undefined : true" :class="prefix" :role="named() ? 'img' : undefined" :style="{ width: props.width, height: props.height }" />
</template>
