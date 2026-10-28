import React from 'react';
import { Progress } from '@fibrae/semi-ui-react';

export default function ProgressDemo() {
    return (
        <React.Fragment>
            <Progress percent={10} type="circle" size="small" style={{ margin: 5 }} aria-label="disk usage" />
            <Progress percent={25} type="circle" size="small" style={{ margin: 5 }} aria-label="disk usage" />
            <Progress percent={50} type="circle" size="small" style={{ margin: 5 }} aria-label="disk usage" />
            <Progress percent={80} type="circle" size="small" style={{ margin: 5 }} aria-label="disk usage" />
        </React.Fragment>
    );
}
