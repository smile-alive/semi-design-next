import { Progress } from '@fibrae/semi-ui-solid';

export default function ProgressDemo() {
    return (
        <>
            <Progress percent={10} type="circle" size="small" style={{ margin: '5px' }} aria-label="disk usage" />
            <Progress percent={25} type="circle" size="small" style={{ margin: '5px' }} aria-label="disk usage" />
            <Progress percent={50} type="circle" size="small" style={{ margin: '5px' }} aria-label="disk usage" />
            <Progress percent={80} type="circle" size="small" style={{ margin: '5px' }} aria-label="disk usage" />
        </>
    );
}
