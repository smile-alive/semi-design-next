import { useState } from 'react';
import { IconDelete } from '@fibrae/semi-icons-react';
import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    const [saveLoading, setSaveLoading] = useState(false);
    const [delLoading, setDelLoading] = useState(true);
    const [repLoading, setRepLoading] = useState(true);

    const reset = (status: boolean) => {
        setSaveLoading(status);
        setDelLoading(status);
        setRepLoading(status);
    };

    return (
        <div>
            <div>
                <div className="btn-margin-right" style={{ display: 'inline-flex', alignItems: 'center', paddingBottom: 14 }}>
                    <Button onClick={() => reset(false)}>关闭加载态</Button>
                    <Button onClick={() => reset(true)}>开启加载态</Button>
                </div>
            </div>
            <hr />
            <Button loading={saveLoading} onClick={() => setSaveLoading(true)} style={{ marginRight: 14 }}>
                保存
            </Button>
            <Button loading={delLoading} icon={<IconDelete />} type="danger" onClick={() => setDelLoading(true)} style={{ marginRight: 14 }}>
                删除
            </Button>
            <div style={{ width: 200, display: 'inline-block' }}>
                <Button loading={repLoading} type="warning" block theme="solid" onClick={() => setRepLoading(true)}>
                    撤销
                </Button>
            </div>
        </div>
    );
}
