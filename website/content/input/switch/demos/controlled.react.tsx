import { useState } from 'react';
import { Switch } from '@fibrae/semi-ui-react';

export default function SwitchDemo() {
    const [checked, setChecked] = useState(true);

    const onChange = (checked: boolean) => {
        setChecked(checked);
    };

    return <Switch checked={checked} aria-label="a switch for demo" onChange={onChange} />;
}
