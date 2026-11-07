import ConfigureButton from './button';
import Configure from './configure';
import ConfigureMcp from './mcp';
import ConfigureRadioButton from './radio-button';
import ConfigureSelect from './select';

export type { ConfigureHandle, ConfigureProps } from './configure';
export type { McpOption, McpProps } from './mcp';
export type { ConfigureItemOpts, ConfigureItemProps } from './get-configure-item';

export default Object.assign(Configure, {
    Button: ConfigureButton,
    Select: ConfigureSelect,
    Mcp: ConfigureMcp,
    RadioButton: ConfigureRadioButton,
});
