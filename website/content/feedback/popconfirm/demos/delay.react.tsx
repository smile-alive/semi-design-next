import { Popconfirm, Button } from '@fibrae/semi-ui-react';

export default function PopconfirmDemo() {
    const onConfirm = () => {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log('resolve,close popconfirm');
                resolve();
            }, 2000);
        });
    };

    const onCancel = () => {
        return new Promise((_resolve, reject) => {
            setTimeout(() => {
                console.log('reject, popconfirm still exist');
                reject();
            }, 2000);
        });
    };

    return (
        <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" onConfirm={onConfirm} onCancel={onCancel}>
            <Button>保存</Button>
        </Popconfirm>
    );
}
