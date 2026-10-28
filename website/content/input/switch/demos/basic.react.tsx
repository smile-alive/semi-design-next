import { Switch } from '@fibrae/semi-ui-react';

export default function SwitchDemo() {
    return (
        <div>
            <Switch onChange={(v) => console.log(v)} aria-label="a switch for demo" />
            <br />
            <Switch defaultChecked onChange={(v) => console.log(v)} aria-label="a switch for semi demo" />
        </div>
    );
}
