import { useState } from 'react';
import { IconSemiLogo, IconVigoLogo } from '@fibrae/semi-icons-react';
import { Button, List, Modal } from '@fibrae/semi-ui-react';

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
    width: 240,
    margin: '4px 50px',
};

export default function ModalDemo() {
    const [visible, setVisible] = useState(false);
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
                visible={visible}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={
                    <div style={{ textAlign: 'center' }}>
                        <Button type="primary" theme="solid" onClick={handleOk} style={btnStyle}>
                            Continue
                        </Button>
                        <Button type="primary" theme="borderless" onClick={handleCancel} style={btnStyle}>
                            Learn more features
                        </Button>
                    </div>
                }
            >
                <h3 style={{ textAlign: 'center', fontSize: 24, margin: 40 }}>Semi Design New Features</h3>
                <List
                    dataSource={data}
                    split={false}
                    renderItem={(item) => (
                        <List.Item
                            header={<item.icon style={{ fontSize: 48 }} />}
                            main={
                                <div>
                                    <h6 style={{ margin: 0, fontSize: 16 }}>{item.title}</h6>
                                    <p style={{ marginBlockStart: 4, color: 'var(--semi-color-text-1)' }}>{item.content}</p>
                                </div>
                            }
                        />
                    )}
                />
            </Modal>
        </>
    );
}
