import { Select, Avatar, Tag, type SelectRenderMultipleSelectedItemFn as RenderMultipleSelectedItemFn, type SelectRenderSingleSelectedItemFn as RenderSingleSelectedItemFn } from '@fibrae/semi-ui-react';

interface ListItem {
    name: string;
    email: string;
    avatar: string;
}

export default function SelectDemo() {
    const list: ListItem[] = [
        {
            name: '夏可漫',
            email: 'xiakeman@example.com',
            avatar: '/assets/placeholder/avatar-a.svg',
        },
        {
            name: '申悦',
            email: 'shenyue@example.com',
            avatar: '/assets/root-web-sites/bag.jpeg',
        },
        {
            name: '曲晨一',
            email: 'quchenyi@example.com',
            avatar: '/assets/placeholder/avatar-c.svg',
        },
        {
            name: '文嘉茂',
            email: 'wenjiamao@example.com',
            avatar: '/assets/root-web-sites/6fbafc2d-e3e6-4cff-a1e2-17709c680624.png',
        },
    ];

    const renderSelectedItem: RenderSingleSelectedItemFn = (optionNode) => (
        <div key={optionNode.email} style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={optionNode.avatar} alt="" size="small" />
            <span style={{ marginLeft: 8 }}>{optionNode.email}</span>
        </div>
    );

    const renderMultipleWithCustomTag: RenderMultipleSelectedItemFn = (optionNode, { onClose }) => {
        const content = (
            <Tag avatarSrc={optionNode.avatar} avatarShape="circle" closable onClose={onClose} size="large" key={optionNode.name}>
                {optionNode.name}
            </Tag>
        );
        return {
            isRenderInTag: false,
            content,
        };
    };

    const renderMultipleWithCustomTag2: RenderMultipleSelectedItemFn = (optionNode, { onClose }) => {
        const content = (
            <Tag avatarSrc={optionNode.avatar} avatarShape="square" closable onClose={onClose} size="large" key={optionNode.name}>
                {optionNode.name}
            </Tag>
        );
        return {
            isRenderInTag: false,
            content,
        };
    };

    const renderCustomOption = (item: ListItem) => {
        const optionStyle = {
            display: 'flex',
            paddingLeft: 24,
            paddingTop: 10,
            paddingBottom: 10,
        };
        return (
            <Select.Option value={item.name} style={optionStyle} showTick {...item} key={item.email}>
                <Avatar size="small" src={item.avatar} alt="" />
                <div style={{ marginLeft: 8 }}>
                    <div style={{ fontSize: 14 }}>{item.name}</div>
                    <div style={{ color: 'var(--color-text-2)', fontSize: 12, lineHeight: '16px', fontWeight: 'normal' }}>{item.email}</div>
                </div>
            </Select.Option>
        );
    };

    return (
        <>
            <Select placeholder="请选择" style={{ width: 280, height: 40 }} onChange={(v) => console.log(v)} defaultValue="申悦" renderSelectedItem={renderSelectedItem}>
                {list.map(renderCustomOption)}
            </Select>
            <Select placeholder="请选择" maxTagCount={2} style={{ width: 280, marginTop: 20 }} onChange={(v) => console.log(v)} defaultValue={['申悦', '曲晨一']} multiple renderSelectedItem={renderMultipleWithCustomTag}>
                {list.map(renderCustomOption)}
            </Select>
            <Select placeholder="请选择" maxTagCount={2} style={{ width: 280, marginTop: 20 }} onChange={(v) => console.log(v)} defaultValue={['申悦', '曲晨一']} multiple renderSelectedItem={renderMultipleWithCustomTag2}>
                {list.map(renderCustomOption)}
            </Select>
        </>
    );
}
