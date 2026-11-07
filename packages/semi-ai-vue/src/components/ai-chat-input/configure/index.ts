import ConfigureButton from './button';
import Configure from './configure.vue';
import ConfigureMcp from './mcp.vue';
import ConfigureRadioButton from './radio-button';
import ConfigureSelect from './select';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
const ConfigureWithParts: typeof Configure & {
    Button: typeof ConfigureButton;
    Select: typeof ConfigureSelect;
    Mcp: typeof ConfigureMcp;
    RadioButton: typeof ConfigureRadioButton;
} = Object.assign(Configure, {
    Button: ConfigureButton,
    Select: ConfigureSelect,
    Mcp: ConfigureMcp,
    RadioButton: ConfigureRadioButton,
});
export default ConfigureWithParts;
