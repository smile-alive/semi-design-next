import { Progress } from '@fibrae/semi-ui-react';

export default function ProgressDemo() {
    return (
        <div style={{ width: 240 }}>
            <Progress indeterminate aria-label="正在加载" />
            <br />
            <Progress indeterminate size="large" aria-label="正在加载" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
                <Progress indeterminate type="circle" aria-label="正在加载" />
                <Progress indeterminate type="circle" size="small" aria-label="正在加载" />
            </div>
        </div>
    );
}
