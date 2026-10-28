import Radio from './radio';
import Group from './radio-group';

export const RadioWithGroup = Object.assign(Radio, { Group });

export default RadioWithGroup;
export { default as Radio } from './radio';
export type { RadioInnerProps } from './radio-inner';
export type { RadioGroupProps, OptionItem } from './radio-group';
export type { RadioDisplayMode, RadioType, RadioProps, RadioChangeEvent, RadioHandle } from './radio';
