import Checkbox from './checkbox';
import CheckboxGroup from './checkbox-group';

export type { CheckboxProps, CheckboxEvent, CheckboxEventTarget } from './checkbox';
export type { CheckboxGroupProps, CheckboxOptionItem, CheckboxType, CheckboxDirection, CheckboxValue } from './checkbox-group';

export { CheckboxGroup };

export default Object.assign(Checkbox, { Group: CheckboxGroup });
