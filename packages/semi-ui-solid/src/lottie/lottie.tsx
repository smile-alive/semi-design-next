import { Show, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/lottie/constants';
import LottieFoundation, { type LottieAdapter, type LottieBaseProps, type LottieBaseState } from '@fibrae/semi-foundation/lottie/foundation';
import { isDev } from '@fibrae/semi-foundation/utils/warning';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';

export interface LottieProps extends LottieBaseProps, ElementProps<'div'> {}

export interface LottieState extends LottieBaseState {}

const defaultProps = {} satisfies Partial<LottieProps>;

function Lottie(rawProps: LottieProps) {
    const props = useDefaultProps('Lottie', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['params', 'width', 'height', 'getAnimationInstance', 'getLottie', 'class', 'style', 'ref']);

    let wrapper: HTMLDivElement | undefined;

    useFoundation<LottieFoundation<LottieProps>, LottieAdapter<LottieProps>, LottieProps, LottieState>(
        LottieFoundation,
        props,
        () => ({}),
        (base) => ({
            getContainer: () => wrapper ?? null,
            notifyAnimationInstance: (animation) => base.getProps().getAnimationInstance?.(animation),
            notifyLottie: (lottie) => base.getProps().getLottie?.(lottie),
            notifyLoadError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        })
    );

    const named = () => Boolean(rest['aria-label'] || rest['aria-labelledby']);

    const style = () => {
        const own = local.style;
        if (typeof own === 'string') {
            return [local.width && `width: ${local.width}`, local.height && `height: ${local.height}`, own].filter(Boolean).join('; ');
        }
        return { width: local.width, height: local.height, ...own };
    };

    return (
        <Show when={!local.params.container}>
            {/* the caller's aria-hidden and role come later in the spread and win */}
            {/* Show's children memo tracks the ref read; a spread props signal would recreate the wrapper */}
            <div aria-hidden={named() ? undefined : true} role={named() ? 'img' : undefined} {...rest} ref={untrack(() => mergeRefs(local.ref, (node: HTMLDivElement) => (wrapper = node)))} class={clsx(cssClasses.PREFIX, local.class)} style={style()} />
        </Show>
    );
}

// explicit type: lottie-web is a foundation dependency, so its LottiePlayer cannot be named from the d.ts
export default Object.assign(Lottie, { getLottie: LottieFoundation.getLottie as typeof LottieFoundation.getLottie });
