<script lang="ts">
    import { untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/lottie/constants';
    import LottieFoundation, { type LottieAdapter, type LottieBaseProps, type LottieBaseState } from '@fibrae/semi-foundation/lottie/foundation';
    import { isDev } from '@fibrae/semi-foundation/utils/warning';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import type { LottieProps } from './interface.js';

    type Foundation = LottieFoundation<LottieBaseProps, LottieBaseState>;
    type Adapter = LottieAdapter<LottieBaseProps, LottieBaseState>;

    const defaults = useDefaultProps('Lottie');
    let { params, width = defaults('width'), height = defaults('height'), getAnimationInstance, getLottie, ...rest }: LottieProps = $props();

    let wrapper: HTMLDivElement | undefined = $state();

    // compared by content: a parent that rebuilds an equal object must not restart the animation
    let loaded = untrack(() => $state.snapshot(params));

    const foundationProps: LottieBaseProps = {
        // lottie-web mutates the animation data, so it must not get a reactive proxy
        get params() {
            return $state.snapshot(params) as LottieBaseProps['params'];
        },
        get getAnimationInstance() {
            return getAnimationInstance;
        },
        get getLottie() {
            return getLottie;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, LottieBaseProps, LottieBaseState>(
        LottieFoundation,
        foundationProps,
        () => ({}),
        () => ({
            getContainer: () => wrapper ?? null,
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

    watch(
        () => $state.snapshot(params),
        (next) => {
            if (!isEqual(next, loaded)) {
                loaded = next;
                foundation.handleParamsUpdate();
            }
        }
    );
</script>

{#if !params.container}
    <div {...rest} aria-hidden={rest['aria-hidden'] ?? (named ? undefined : 'true')} bind:this={wrapper} class={[cssClasses.PREFIX, rest.class]} role={rest.role ?? (named ? 'img' : undefined)} {style}></div>
{/if}
