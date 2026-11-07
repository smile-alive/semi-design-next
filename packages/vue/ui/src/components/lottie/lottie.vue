<script setup lang="ts">
    import { toRaw, useAttrs, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/lottie/constants';
    import LottieFoundation, { type LottieAdapter, type LottieBaseProps, type LottieBaseState } from '@fibrae/semi-foundation/components/lottie/foundation';
    import { isDev } from '@fibrae/semi-foundation/utils/warning';
    import type { ElementProps, EmitHandlers } from '../../base/element-props';
    import { semiGlobalDefault } from '../../base/semi-default';
    import useFoundation from '../../base/use-foundation';
    import useKeepAliveFoundation from '../../base/use-keep-alive-foundation';
    import type { LottieEmits, LottieProps } from './interface';

    type Foundation = LottieFoundation<LottieBaseProps>;
    type Adapter = LottieAdapter<LottieBaseProps>;

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
            notifyAnimationInstance: (animation) => emit('getAnimationInstance', animation),
            notifyLottie: (lottie) => emit('getLottie', lottie),
            notifyLoadError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        }),
        {
            // lottie-web mutates the animation data, so it must not be a reactive proxy
            props: { params: () => toRaw(props.params) },
        }
    );

    const prefix = cssClasses.PREFIX;

    const named = () => Boolean(attrs['aria-label'] || attrs['aria-labelledby']);

    useKeepAliveFoundation(foundation);
</script>

<template>
    <div v-if="!props.params.container" ref="wrapper" :aria-hidden="named() ? undefined : true" :class="prefix" :role="named() ? 'img' : undefined" :style="{ width: props.width, height: props.height }" />
</template>
