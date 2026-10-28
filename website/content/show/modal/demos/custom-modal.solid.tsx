import { createSignal } from 'solid-js';
import { IconSemiLogo, IconVigoLogo } from '@fibrae/semi-icons-solid';
import { Button, List, Modal } from '@fibrae/semi-ui-solid';

const data = [
    {
        icon: IconSemiLogo,
        title: 'Boost new feature adoption with Integration',
        content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
    },
    {
        icon: IconVigoLogo,
        title: 'Introducing Dark Mode',
        content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
    },
    {
        icon: IconSemiLogo,
        title: 'New List Component',
        content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
    },
];

const btnStyle = {
    width: '240px',
    margin: '4px 50px',
};

export default function ModalDemo() {
    const [visible, setVisible] = createSignal(false);
    const showDialog = () => {
        setVisible(true);
    };
    const handleOk = () => {
        setVisible(false);
    };
    const handleCancel = () => {
        setVisible(false);
    };
    return (
        <>
            <Button onClick={showDialog}>自定义对话框</Button>
            <Modal
                header={null}
                visible={visible()}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={
                    <div style={{ 'text-align': 'center' }}>
                        <Button type="primary" theme="solid" onClick={handleOk} style={btnStyle}>
                            Continue
                        </Button>
                        <Button type="primary" theme="borderless" onClick={handleCancel} style={btnStyle}>
                            Learn more features
                        </Button>
                    </div>
                }
            >
                <h3 style={{ 'text-align': 'center', 'font-size': '24px', margin: '40px' }}>Semi Design New Features</h3>
                <List
                    dataSource={data}
                    split={false}
                    renderItem={(item) => (
                        <List.Item
                            header={<item.icon style={{ 'font-size': '48px' }} />}
                            main={
                                <div>
                                    <h6 style={{ margin: 0, 'font-size': '16px' }}>{item.title}</h6>
                                    <p style={{ 'margin-top': '4px', color: 'var(--semi-color-text-1)' }}>{item.content}</p>
                                </div>
                            }
                        />
                    )}
                />
            </Modal>
        </>
    );
}
