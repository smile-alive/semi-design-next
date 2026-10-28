import RadioGroup from './radio-group.vue';
import Radio from './radio.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const RadioWithGroup: typeof Radio & { Group: typeof RadioGroup } = Object.assign(Radio, { Group: RadioGroup });
export default RadioWithGroup;
export { RadioGroup };
export type * from './interface';
