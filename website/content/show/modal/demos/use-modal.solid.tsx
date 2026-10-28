import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import { Button, ConfigProvider, Modal } from '@fibrae/semi-ui-solid';

const config = { title: 'This is a success message', content: 'Context consumer' };

export default function ModalDemo() {
    const [modal, contextHolder] = Modal.useModal();

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
