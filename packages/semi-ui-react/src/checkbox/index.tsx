import Checkbox, { type CheckboxProps, type CheckboxEvent, type CheckboxHandle } from './checkbox';
import Group, { type CheckboxGroupProps, type CheckboxOptionItem, type CheckboxType, type CheckboxDirection } from './checkbox-group';

export type { CheckboxInnerProps } from './checkbox-inner';
export const CheckboxWithGroup = Object.assign(Checkbox, { Group });

export { CheckboxWithGroup as Checkbox };

export type { CheckboxProps, CheckboxGroupProps, CheckboxOptionItem, CheckboxEvent, CheckboxHandle, CheckboxType, CheckboxDirection };

export default CheckboxWithGroup;
