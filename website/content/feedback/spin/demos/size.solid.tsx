import { Spin } from '@fibrae/semi-ui-solid';

export default function SpinDemo() {
    return (
        <div style={{ 'margin-inline-start': '30px' }}>
            <div style={{ 'margin-block-end': '5px' }}>size: small</div>
            <Spin size="small" />
            <br />
            <br />
            <div style={{ 'margin-block-end': '10px' }}>size: middle</div>
            <Spin size="middle" />
            <br />
            <br />
            <div style={{ 'margin-block-end': '15px' }}>size: large</div>
            <Spin size="large" />
        </div>
    );
}
