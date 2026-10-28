import { Switch } from '@fibrae/semi-ui-solid';

export default function SwitchDemo() {
    return (
        <div>
            <Switch onChange={(checked) => console.log(checked)} aria-label="a switch for demo" />
            <br />
            <Switch defaultChecked onChange={(checked) => console.log(checked)} aria-label="a switch for semi demo" />
        </div>
    );
}
