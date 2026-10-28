import { Progress } from '@fibrae/semi-ui-solid';

export default function ProgressDemo() {
    return (
        <>
            <Progress percent={75} showInfo type="circle" format={(per) => per + 'Days'} style={{ margin: '10px' }} aria-label="disk usage" />
            <Progress percent={100} showInfo type="circle" format={() => 'Done'} style={{ margin: '10px' }} aria-label="disk usage" />
            <Progress percent={50} type="circle" showInfo={false} style={{ margin: '10px' }} aria-label="disk usage" />
        </>
    );
}
