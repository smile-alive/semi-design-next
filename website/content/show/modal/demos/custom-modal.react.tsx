import { useState } from 'react';
import { IconVigoLogo, IconSemiLogo } from '@fibrae/semi-icons-react';
import { Modal, Button, List } from '@fibrae/semi-ui-react';

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
    const data = [
        {
            icon: <IconSemiLogo style={{ fontSize: 48 }} />,
            title: 'Boost new feature adoption with Integration',
            content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
        },
        {
            icon: <IconVigoLogo style={{ fontSize: 48 }} />,
            title: 'Introducing Dark Mode',
            content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
        },
        {
            icon: <IconSemiLogo style={{ fontSize: 48 }} />,
            title: 'New List Component',
            content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
        },
    ];
    const btnStyle = {
        width: 240,
        margin: '4px 50px',
    };
    const footer = (
        <div style={{ textAlign: 'center' }}>
            <Button type="primary" theme="solid" onClick={handleOk} style={btnStyle}>
                Continue
            </Button>
            <Button type="primary" theme="borderless" onClick={handleCancel} style={btnStyle}>
                Learn more features
            </Button>
        </div>
    );
    return (
        <>
            <Button onClick={showDialog}>自定义对话框</Button>
            <Modal header={null} visible={visible} onOk={handleOk} onCancel={handleCancel} footer={footer}>
                <h3 style={{ textAlign: 'center', fontSize: 24, margin: 40 }}>Semi Design New Features</h3>
                <List
                    dataSource={data}
                    split={false}
                    renderItem={(item) => (
                        <List.Item
                            header={item.icon}
                            main={
                                <div>
                                    <h6 style={{ margin: 0, fontSize: 16 }}>{item.title}</h6>
                                    <p style={{ marginTop: 4, color: 'var(--semi-color-text-1)' }}>{item.content}</p>
                                </div>
                            }
                        />
                    )}
                />
            </Modal>
        </>
    );
}
