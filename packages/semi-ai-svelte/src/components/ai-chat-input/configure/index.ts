import ConfigureButton from './button.svelte';
import ConfigureItem from './configure-item.svelte';
import ConfigureBase from './configure.svelte';
import ConfigureMcp from './mcp.svelte';
import ConfigureRadioButton from './radio-button.svelte';
import ConfigureSelect from './select.svelte';

// Svelte components are functions, so the items attach to the component itself. `Item` turns any component that takes a
// value and a change callback into an item: `<Configure.Item component={Rating} field="rating" />`
const Configure: typeof ConfigureBase & {
    Button: typeof ConfigureButton;
    Select: typeof ConfigureSelect;
    Mcp: typeof ConfigureMcp;
    RadioButton: typeof ConfigureRadioButton;
    Item: typeof ConfigureItem;
} = Object.assign(ConfigureBase, {
    Button: ConfigureButton,
    Select: ConfigureSelect,
    Mcp: ConfigureMcp,
    RadioButton: ConfigureRadioButton,
    Item: ConfigureItem,
});

export default Configure;
