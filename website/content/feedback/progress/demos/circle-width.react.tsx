import React from 'react';
import { Progress } from '@fibrae/semi-ui-react';

export default function ProgressDemo() {
    return (
        <React.Fragment>
            <div>
                <Progress percent={100} type="circle" width={100} style={{ margin: 5 }} aria-label="disk usage" />
            </div>
            <div>
                <Progress percent={100} type="circle" width={100} style={{ margin: 5 }} stroke="var(--semi-color-danger)" aria-label="disk usage" />
            </div>
        </React.Fragment>
    );
}
