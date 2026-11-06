import { createSignal } from 'solid-js';
import { Switch } from '@fibrae/semi-ui-solid';

export default function SwitchDemo() {
    const [checked, setChecked] = createSignal(true);

    const onChange = (checked: boolean) => {
        setChecked(checked);
    };

    return <Switch checked={checked()} aria-label="a switch for demo" onChange={onChange} />;
}
