import type React from 'react';
import { useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/lottie/constants';
import LottieFoundation, { type LottieAdapter, type LottieBaseProps, type LottieBaseState } from '@fibrae/semi-foundation/components/lottie/foundation';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { useMergedRef } from '../../hooks/index';

type Foundation = LottieFoundation<LottieProps>;
type Adapter = LottieAdapter<LottieProps>;

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

    useFoundation<Foundation, Adapter, LottieProps, LottieState>(
        LottieFoundation,
        props,
        () => ({}),
        (base) => ({
            getContainer: () => wrapperRef.current,
            notifyAnimationInstance: (animation) => base.getProps().getAnimationInstance?.(animation),
            notifyLottie: (lottie) => base.getProps().getLottie?.(lottie),
        })
    );

    const mergedRef = useMergedRef(ref, wrapperRef);

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
