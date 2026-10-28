import React from 'react';
import { Progress } from '@fibrae/semi-ui-react';

export default function ProgressDemo() {
    return (
        <React.Fragment>
            <Progress percent={75} showInfo type="circle" format={(per) => per + 'Days'} style={{ margin: 10 }} aria-label="disk usage" />
            <Progress percent={100} showInfo type="circle" format={() => 'Done'} style={{ margin: 10 }} aria-label="disk usage" />
            <Progress percent={50} type="circle" showInfo={false} style={{ margin: 10 }} aria-label="disk usage" />
        </React.Fragment>
    );
}
