import { Progress } from '@fibrae/semi-ui-solid';

export default function ProgressDemo() {
    return (
        <div style={{ height: '100px', display: 'flex' }}>
            <Progress percent={10} direction="vertical" aria-label="disk usage" />
            <Progress percent={25} direction="vertical" aria-label="disk usage" />
            <Progress percent={50} direction="vertical" aria-label="disk usage" />
            <Progress percent={80} direction="vertical" size="large" aria-label="disk usage" />
            <Progress percent={80} direction="vertical" style={{ width: '8px' }} aria-label="disk usage" />
        </div>
    );
}
