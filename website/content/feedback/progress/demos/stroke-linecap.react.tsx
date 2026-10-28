import React from 'react';
import { Progress } from '@fibrae/semi-ui-react';

export default function ProgressDemo() {
    return (
        <React.Fragment>
            <Progress percent={50} strokeLinecap="round" type="circle" style={{ margin: 10 }} aria-label="disk usage" />
            <Progress percent={50} strokeLinecap="square" type="circle" style={{ margin: 10 }} aria-label="disk usage" />
        </React.Fragment>
    );
}
