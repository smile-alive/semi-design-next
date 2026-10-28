import Option from './option';
import OptGroup from './option-group';
import Select from './select';

export default Object.assign(Select, { Option, OptGroup });
export { OptionView } from './option';
export type { OptionProps, OptionViewProps } from './option';
export type { OptionGroupProps } from './option-group';
export type { BasicSelectValue, OptionRenderProps, RenderMultipleSelectedItemFn, RenderSelectedItemFn, RenderSingleSelectedItemFn, SelectChangeValue, SelectedItemProps, SelectElement, SelectHandle, SelectInputProps, SelectProps, SelectSize, SelectValue, TriggerRenderProps, VirtualizeProps } from './select';
