import ConfigureButton from './button';
import Configure from './configure';
import ConfigureMcp from './mcp';
import ConfigureRadioButton from './radio-button';
import ConfigureSelect from './select';

export type { ConfigureHandle, ConfigureProps } from './configure';

export default Object.assign(Configure, {
    Button: ConfigureButton,
    Select: ConfigureSelect,
    Mcp: ConfigureMcp,
    RadioButton: ConfigureRadioButton,
});
