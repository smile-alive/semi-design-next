import { Spin } from '@fibrae/semi-ui-react';

export default function SpinDemo() {
    return (
        <div style={{ marginInlineStart: 30 }}>
            <div style={{ marginBlockEnd: 5 }}>size: small</div>
            <Spin size="small" />
            <br />
            <br />
            <div style={{ marginBlockEnd: 10 }}>size: middle</div>
            <Spin size="middle" />
            <br />
            <br />
            <div style={{ marginBlockEnd: 15 }}>size: large</div>
            <Spin size="large" />
        </div>
    );
}
