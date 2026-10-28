import SelectOptGroup from './option-group.vue';
import SelectOption from './option.vue';
import Select from './select.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const SelectWithParts: typeof Select & { Option: typeof SelectOption; OptGroup: typeof SelectOptGroup } = Object.assign(Select, { Option: SelectOption, OptGroup: SelectOptGroup });
export default SelectWithParts;
export { SelectOption, SelectOptGroup };
export type * from './interface';
