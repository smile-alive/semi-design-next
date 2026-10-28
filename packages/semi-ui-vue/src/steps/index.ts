import Step from './step.vue';
import Steps from './steps.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const StepsWithStep: typeof Steps & { Step: typeof Step } = Object.assign(Steps, { Step });
export default StepsWithStep;
export { Step };
export type * from './interface';
