import { Spin } from '@fibrae/semi-ui-solid';

export default function SpinDemo() {
    return (
        <div style={{ 'margin-left': '30px' }}>
            <div style={{ 'margin-bottom': '5px' }}>size: small</div>
            <Spin size="small" />
            <br />
            <br />
            <div style={{ 'margin-bottom': '10px' }}>size: middle</div>
            <Spin size="middle" />
            <br />
            <br />
            <div style={{ 'margin-bottom': '15px' }}>size: large</div>
            <Spin size="large" />
        </div>
    );
}
