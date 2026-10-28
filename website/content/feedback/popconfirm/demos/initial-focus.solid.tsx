import { Button, Popconfirm, Space } from '@fibrae/semi-ui-solid';

export default function PopconfirmDemo() {
    return (
        <Space>
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" okButtonProps={{ autoFocus: true, type: 'danger' }}>
                {(trigger) => <Button {...trigger()}>确认聚焦</Button>}
            </Popconfirm>
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" cancelButtonProps={{ autoFocus: true }}>
                {(trigger) => <Button {...trigger()}>取消聚焦</Button>}
            </Popconfirm>
            <Popconfirm title="确定是否要保存此修改？" content={(renderProps) => <input ref={renderProps.initialFocusRef} placeholder="focus here" />}>
                {(trigger) => <Button {...trigger()}>内容聚焦</Button>}
            </Popconfirm>
        </Space>
    );
}
