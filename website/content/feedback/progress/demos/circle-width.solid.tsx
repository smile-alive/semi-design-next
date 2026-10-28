import { Progress } from '@fibrae/semi-ui-solid';

export default function ProgressDemo() {
    return (
        <>
            <div>
                <Progress percent={100} type="circle" width={100} style={{ margin: '5px' }} aria-label="disk usage" />
            </div>
            <div>
                <Progress percent={100} type="circle" width={100} style={{ margin: '5px' }} stroke="var(--semi-color-danger)" aria-label="disk usage" />
            </div>
        </>
    );
}
