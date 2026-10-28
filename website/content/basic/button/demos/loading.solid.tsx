import { createSignal } from 'solid-js';
import { IconDelete } from '@fibrae/semi-icons-solid';
import { Button } from '@fibrae/semi-ui-solid';

export default function ButtonDemo() {
    const [saveLoading, setSaveLoading] = createSignal(false);
    const [delLoading, setDelLoading] = createSignal(true);
    const [repLoading, setRepLoading] = createSignal(true);

    const reset = (status: boolean) => {
        setSaveLoading(status);
        setDelLoading(status);
        setRepLoading(status);
    };

    return (
        <div>
            <div>
                <div class="btn-margin-right" style={{ display: 'inline-flex', 'align-items': 'center', 'padding-bottom': '14px' }}>
                    <Button onClick={() => reset(false)}>关闭加载态</Button>
                    <Button onClick={() => reset(true)}>开启加载态</Button>
                </div>
            </div>
            <hr />
            <Button loading={saveLoading()} onClick={() => setSaveLoading(true)} style={{ 'margin-right': '14px' }}>
                保存
            </Button>
            <Button loading={delLoading()} icon={<IconDelete />} type="danger" onClick={() => setDelLoading(true)} style={{ 'margin-right': '14px' }}>
                删除
            </Button>
            <div style={{ width: '200px', display: 'inline-block' }}>
                <Button loading={repLoading()} type="warning" block theme="solid" onClick={() => setRepLoading(true)}>
                    撤销
                </Button>
            </div>
        </div>
    );
}
