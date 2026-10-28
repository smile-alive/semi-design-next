import { Progress } from '@fibrae/semi-ui-solid';

export default function ProgressDemo() {
    return (
        <>
            <Progress percent={50} strokeLinecap="round" type="circle" style={{ margin: '10px' }} aria-label="disk usage" />
            <Progress percent={50} strokeLinecap="square" type="circle" style={{ margin: '10px' }} aria-label="disk usage" />
        </>
    );
}
