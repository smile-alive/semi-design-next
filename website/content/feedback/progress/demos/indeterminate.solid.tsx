import { Progress } from '@fibrae/semi-ui-solid';

export default function ProgressDemo() {
    return (
        <div style={{ width: '240px' }}>
            <Progress indeterminate aria-label="正在加载" />
            <br />
            <Progress indeterminate size="large" aria-label="正在加载" />
            <div style={{ display: 'flex', 'align-items': 'center', gap: '16px', 'margin-top': '20px' }}>
                <Progress indeterminate type="circle" aria-label="正在加载" />
                <Progress indeterminate type="circle" size="small" aria-label="正在加载" />
            </div>
        </div>
    );
}
