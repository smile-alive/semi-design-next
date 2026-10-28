import { Switch } from '@fibrae/semi-ui-solid';

export default function SwitchDemo() {
    return (
        <div>
            <Switch disabled aria-label="a switch for demo" />
            <br />
            <Switch disabled checked aria-label="a switch for demo" />
        </div>
    );
}
