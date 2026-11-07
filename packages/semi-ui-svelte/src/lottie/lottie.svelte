<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/lottie/constants';
    import LottieFoundation, { type LottieAdapter, type LottieBaseProps, type LottieBaseState } from '@fibrae/semi-foundation/components/lottie/foundation';
    import { isDev } from '@fibrae/semi-foundation/utils/warning';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import type { LottieProps } from './interface.js';

    type Foundation = LottieFoundation<LottieBaseProps>;
    type Adapter = LottieAdapter<LottieBaseProps>;

    const defaults = useDefaultProps('Lottie');
    let { params, width = defaults('width'), height = defaults('height'), getAnimationInstance, getLottie, ...rest }: LottieProps = $props();

    let wrapper: HTMLDivElement | undefined = $state();

    const foundationProps: LottieBaseProps = {
        // lottie-web mutates the animation data, so it must not get a reactive proxy
        get params() {
            return $state.snapshot(params) as LottieBaseProps['params'];
        },
    };

    useFoundation<Foundation, Adapter, LottieBaseProps, LottieBaseState>(
        LottieFoundation,
        foundationProps,
        () => ({}),
        () => ({
            getContainer: () => wrapper ?? null,
            notifyAnimationInstance: (animation) => getAnimationInstance?.(animation),
            notifyLottie: (lottie) => getLottie?.(lottie),
            notifyLoadError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        })
    );

    // a named animation is an image; an unnamed one is decoration
    const named = $derived(Boolean(rest['aria-label'] || rest['aria-labelledby']));
    const style = $derived([width && `width: ${width}`, height && `height: ${height}`, rest.style].filter(Boolean).join('; '));
</script>

{#if !params.container}
    <div {...rest} aria-hidden={rest['aria-hidden'] ?? (named ? undefined : 'true')} bind:this={wrapper} class={[cssClasses.PREFIX, rest.class]} role={rest.role ?? (named ? 'img' : undefined)} {style}></div>
{/if}
