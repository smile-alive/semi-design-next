import LottieFoundation from '@fibrae/semi-foundation/lottie/foundation';
import LottieComponent from './lottie.svelte';

// annotated because the inferred type inlines lottie-web's types, which declaration emit cannot name
export const Lottie: typeof LottieComponent & { getLottie: typeof LottieFoundation.getLottie } = Object.assign(LottieComponent, { getLottie: LottieFoundation.getLottie });
export type { LottieAnimation, LottieModule, LottieParams, LottieProps } from './interface.js';
