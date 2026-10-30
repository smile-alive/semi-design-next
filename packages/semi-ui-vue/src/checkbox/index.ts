import CheckboxGroup from './checkbox-group.vue';
import Checkbox from './checkbox.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const CheckboxWithGroup: typeof Checkbox & { Group: typeof CheckboxGroup } = Object.assign(Checkbox, {
    Group: CheckboxGroup,
});
export default CheckboxWithGroup;
export { default as CheckboxGroup } from './checkbox-group.vue';
export type * from './interface';
