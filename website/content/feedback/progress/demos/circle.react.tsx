import { Progress } from '@fibrae/semi-ui-react';

export default function ProgressDemo() {
    return (
        <div>
            <Progress percent={10} type="circle" style={{ margin: 5 }} aria-label="disk usage" />
            <Progress percent={25} type="circle" style={{ margin: 5 }} aria-label="disk usage" />
            <Progress percent={50} type="circle" style={{ margin: 5 }} aria-label="disk usage" />
            <Progress percent={80} type="circle" style={{ margin: 5 }} aria-label="disk usage" />
        </div>
    );
}
