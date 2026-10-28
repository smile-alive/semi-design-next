import LottieFoundation from '@fibrae/semi-foundation/lottie/foundation';
import Lottie from './lottie.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents, and does not name
// lottie-web, which only semi-foundation depends on.
const LottieWithStatic: typeof Lottie & { getLottie: typeof LottieFoundation.getLottie } = Object.assign(Lottie, {
    getLottie: LottieFoundation.getLottie,
});
export default LottieWithStatic;
export type * from './interface';
