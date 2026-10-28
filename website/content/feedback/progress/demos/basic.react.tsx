import { Progress } from '@fibrae/semi-ui-react';

export default function ProgressDemo() {
    return (
        <div style={{ width: 200 }}>
            <Progress percent={10} stroke="var(--semi-color-warning)" aria-label="disk usage" />
            <br />
            <Progress percent={25} stroke="var(--semi-color-danger)" aria-label="disk usage" />
            <br />
            <Progress percent={50} aria-label="disk usage" />
            <br />
            <Progress percent={80} aria-label="download progress" />
            <br />
            <Progress percent={80} size="large" aria-label="disk usage" />
            <br />
            <Progress percent={80} style={{ height: '8px' }} aria-label="disk usage" />
        </div>
    );
}
