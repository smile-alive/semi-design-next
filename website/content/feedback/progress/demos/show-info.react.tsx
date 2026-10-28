import { Progress } from '@fibrae/semi-ui-react';

export default function ProgressDemo() {
    return (
        <div style={{ width: 200 }}>
            <Progress percent={10} stroke="var(--semi-color-warning)" showInfo aria-label="disk usage" />
            <br />
            <Progress percent={25} stroke="var(--semi-color-danger)" showInfo aria-label="disk usage" />
            <br />
            <Progress percent={50} showInfo aria-label="disk usage" />
            <br />
            <Progress percent={50} showInfo format={(percent) => percent * 10 + '‰'} aria-label="disk usage" />
        </div>
    );
}
