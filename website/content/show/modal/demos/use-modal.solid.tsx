import { Button, ConfigProvider, Modal } from '@fibrae/semi-ui-solid';
import { en_US } from '@fibrae/semi-ui-solid/locale';

const config = { title: 'This is a success message', content: 'Context consumer' };

export default function ModalDemo() {
    const [modal, contextHolder] = Modal.useModal();

    return (
        <ConfigProvider locale={en_US}>
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
