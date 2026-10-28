import type { LottieBaseProps } from '@fibrae/semi-foundation/lottie/foundation';

// lottie-web is a semi-foundation dependency and cannot be imported here; interfaces keep declaration emit from
// inlining its types.
type AnimationSource = NonNullable<Parameters<NonNullable<LottieBaseProps['getAnimationInstance']>>[0]>;
type ModuleSource = Parameters<NonNullable<LottieBaseProps['getLottie']>>[0];

export type LottieParams = LottieBaseProps['params'];
export interface LottieAnimation extends AnimationSource {}
export interface LottieModule extends ModuleSource {}

export interface LottieProps {
    /**
     * The options of lottie-web's `loadAnimation`. It reloads when the content changes, not when the object is
     * mutated in place: replace it, and hold large animation data in a `shallowRef`.
     */
    params: LottieParams;
    width?: string;
    height?: string;
}

export interface LottieEmits {
    /** Once per animation created, including every reload */
    getAnimationInstance: [animation: LottieAnimation];
    /** Once per mount, with the lottie-web module */
    getLottie: [lottie: LottieModule];
}
