import { Spin } from '@fibrae/semi-ui-react';

export default function SpinDemo() {
    return (
        <div style={{ marginLeft: 30 }}>
            <div style={{ marginBottom: 5 }}>size: small</div>
            <Spin size="small" />
            <br />
            <br />
            <div style={{ marginBottom: 10 }}>size: middle</div>
            <Spin size="middle" />
            <br />
            <br />
            <div style={{ marginBottom: 15 }}>size: large</div>
            <Spin size="large" />
        </div>
    );
}
