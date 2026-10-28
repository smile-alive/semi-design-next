import { Switch, Space } from '@fibrae/semi-ui-react';

export default function SwitchDemo() {
    return (
        <div>
            <Space style={{ marginBottom: 10, display: 'block' }}>
                <Switch size="small" aria-label="a switch for demo" />
                <Switch defaultChecked size="small" aria-label="a switch for demo" />
                <Switch size="small" loading aria-label="a switch for demo" />
                <Switch size="small" loading defaultChecked aria-label="a switch for demo" />
            </Space>
            <Space style={{ marginBottom: 10, display: 'block' }}>
                <Switch aria-label="a switch for demo" />
                <Switch defaultChecked aria-label="a switch for demo" />
                <Switch loading aria-label="a switch for demo" />
                <Switch loading defaultChecked aria-label="a switch for demo" />
            </Space>
            <Space>
                <Switch size="large" aria-label="a switch for demo" />
                <Switch defaultChecked size="large" aria-label="a switch for demo" />
                <Switch size="large" loading aria-label="a switch for demo" />
                <Switch size="large" loading defaultChecked aria-label="a switch for demo" />
            </Space>
        </div>
    );
}
