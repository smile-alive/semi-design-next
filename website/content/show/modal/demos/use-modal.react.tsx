import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import { ConfigProvider, Button, Modal } from '@fibrae/semi-ui-react';

export default function ModalDemo() {
    const [modal, contextHolder] = Modal.useModal();
    const config = { title: 'This is a success message', content: 'Context consumer' };

    return (
        <ConfigProvider locale={en_GB}>
            <div>
                <Button
                    onClick={() => {
                        modal.confirm(config);
                    }}
                >
                    Confirm Modal
                </Button>
            </div>
            {contextHolder}
        </ConfigProvider>
    );
}
