import Radio from './radio';
import RadioGroup from './radio-group';

export type { RadioDisplayMode, RadioType, RadioProps, RadioChangeEvent } from './radio';
export type { RadioGroupProps, OptionItem } from './radio-group';

export { RadioGroup };

export default Object.assign(Radio, { Group: RadioGroup });
