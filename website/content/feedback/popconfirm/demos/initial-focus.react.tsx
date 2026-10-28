import { Button, Popconfirm, Space } from '@fibrae/semi-ui-react';

export default function PopconfirmDemo() {
    return (
        <Space>
            <Popconfirm
                title="确定是否要保存此修改？"
                content="此修改将不可逆"
                okButtonProps={{
                    autoFocus: true,
                    type: 'danger',
                }}
            >
                <Button>确认聚焦</Button>
            </Popconfirm>
            <Popconfirm
                title="确定是否要保存此修改？"
                content="此修改将不可逆"
                cancelButtonProps={{
                    autoFocus: true,
                }}
            >
                <Button>取消聚焦</Button>
            </Popconfirm>
            <Popconfirm
                title="确定是否要保存此修改？"
                content={({ initialFocusRef }) => {
                    return <input ref={initialFocusRef} placeholder="focus here" />;
                }}
            >
                <Button>内容聚焦</Button>
            </Popconfirm>
        </Space>
    );
}
