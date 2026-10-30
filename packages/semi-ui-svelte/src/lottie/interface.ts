import type { HTMLAttributes } from 'svelte/elements';
import type { LottieBaseProps } from '@fibrae/semi-foundation/lottie/foundation';

// lottie-web is a semi-foundation dependency and cannot be imported here; interfaces keep declaration emit from
// inlining its types.
type AnimationSource = NonNullable<Parameters<NonNullable<LottieBaseProps['getAnimationInstance']>>[0]>;
type ModuleSource = Parameters<NonNullable<LottieBaseProps['getLottie']>>[0];

export type LottieParams = LottieBaseProps['params'];
export interface LottieAnimation extends AnimationSource {}
export interface LottieModule extends ModuleSource {}

export interface LottieProps extends HTMLAttributes<HTMLDivElement> {
    /** The options of lottie-web's `loadAnimation`. It reloads when its content changes. */
    params: LottieParams;
    width?: string;
    height?: string;
    /** Once per animation created, including every reload */
    getAnimationInstance?: (animation: LottieAnimation) => void;
    /** Once per mount, with the lottie-web module */
    getLottie?: (lottie: LottieModule) => void;
}
