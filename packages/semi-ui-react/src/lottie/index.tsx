import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/lottie/constants';
import LottieFoundation, { type LottieAdapter, type LottieBaseProps, type LottieBaseState } from '@fibrae/semi-foundation/lottie/foundation';
import { isDev } from '@fibrae/semi-foundation/utils/warning';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';

export interface LottieProps extends LottieBaseProps, ElementProps<'div'> {
    className?: string;
    style?: React.CSSProperties;
    /** Attached to the wrapper div; null when `params.container` is set, since nothing is rendered then */
    ref?: React.Ref<HTMLDivElement>;
}

export interface LottieState extends LottieBaseState {}

const defaultProps = {} satisfies Partial<LottieProps>;

function Lottie(rawProps: LottieProps) {
    const props = useDefaultProps('Lottie', rawProps, defaultProps);
    const { ref, params, width, height, getAnimationInstance, getLottie, className, style, ...rest } = props;

    const wrapperRef = useRef<HTMLDivElement>(null);

    // params is usually a fresh literal, so compare deeply
    const committedParams = useRef(params);

    const [foundation] = useFoundation<LottieFoundation<LottieProps, LottieState>, LottieAdapter<LottieProps, LottieState>, LottieProps, LottieState>(
        LottieFoundation,
        props,
        () => ({}),
        () => ({
            getContainer: () => wrapperRef.current,
            notifyLoadError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        })
    );

    const mergedRef = useMergedRef(ref, wrapperRef);

    useLayoutEffect(() => {
        if (!isEqual(committedParams.current, params)) {
            committedParams.current = params;
            foundation.handleParamsUpdate();
        }
    });

    if (params.container) {
        return null;
    }

    // a named animation is an image; an unnamed one is decoration
    const { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby } = rest as React.AriaAttributes;
    const named = Boolean(ariaLabel || ariaLabelledby);

    return <div aria-hidden={named ? undefined : true} role={named ? 'img' : undefined} {...rest} ref={mergedRef} className={clsx(cssClasses.PREFIX, className)} style={{ width, height, ...style }} />;
}

// explicit type: lottie-web is a foundation dependency, so its LottiePlayer cannot be named from the d.ts
export default Object.assign(Lottie, { getLottie: LottieFoundation.getLottie as typeof LottieFoundation.getLottie });
