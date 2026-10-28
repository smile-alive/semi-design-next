import { createSignal } from 'solid-js';
import { Switch } from '@fibrae/semi-ui-solid';

export default function SwitchDemo() {
    const [checked, setChecked] = createSignal(true);

    return <Switch checked={checked()} aria-label="a switch for demo" onChange={(value) => setChecked(value)} />;
}
