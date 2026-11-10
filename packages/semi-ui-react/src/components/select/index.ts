import Option from './option';
import OptionGroup from './option-group';
import Select from './select';

export default Object.assign(Select, { Option, OptGroup: OptionGroup });
export type * from './select';
