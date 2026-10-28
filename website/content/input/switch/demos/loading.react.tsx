import { Switch } from '@fibrae/semi-ui-react';

export default function SwitchDemo() {
    return (
        <div>
            <Switch loading aria-label="Loading switch" />
            <br />
            <Switch loading defaultChecked aria-label="Loading switch, on" />
        </div>
    );
}
