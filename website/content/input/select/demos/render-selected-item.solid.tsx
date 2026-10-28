import { For } from 'solid-js';
import { Avatar, Select, Tag, type SelectRenderMultipleSelectedItemFn, type SelectRenderSingleSelectedItemFn } from '@fibrae/semi-ui-solid';

interface ListItem {
    name: string;
    email: string;
    avatar: string;
}

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

const optionStyle = {
    display: 'flex',
    'padding-left': '24px',
    'padding-top': '10px',
    'padding-bottom': '10px',
};

const renderSelectedItem: SelectRenderSingleSelectedItemFn = (optionNode) => (
    <div style={{ display: 'flex', 'align-items': 'center' }}>
        <Avatar src={String(optionNode.avatar)} alt="" size="small" />
        <span style={{ 'margin-left': '8px' }}>{String(optionNode.email)}</span>
    </div>
);

const renderMultipleWithTag =
    (avatarShape: 'circle' | 'square'): SelectRenderMultipleSelectedItemFn =>
    (optionNode, { onClose }) => ({
        isRenderInTag: false,
        content: (
            <Tag avatarSrc={String(optionNode.avatar)} avatarShape={avatarShape} closable onClose={onClose} size="large">
                {String(optionNode.name)}
            </Tag>
        ),
    });

const renderCustomOption = (item: ListItem) => (
    <Select.Option {...item} value={item.name} style={optionStyle} showTick>
        <Avatar size="small" src={item.avatar} alt="" />
        <div style={{ 'margin-left': '8px' }}>
            <div style={{ 'font-size': '14px' }}>{item.name}</div>
            <div style={{ color: 'var(--color-text-2)', 'font-size': '12px', 'line-height': '16px', 'font-weight': 'normal' }}>{item.email}</div>
        </div>
    </Select.Option>
);

export default function SelectDemo() {
    return (
        <>
            <Select placeholder="请选择" style={{ width: '280px', height: '40px' }} onChange={(v) => console.log(v)} defaultValue="申悦" renderSelectedItem={renderSelectedItem}>
                <For each={list}>{renderCustomOption}</For>
            </Select>
            <Select placeholder="请选择" maxTagCount={2} style={{ width: '280px', 'margin-top': '20px' }} onChange={(v) => console.log(v)} defaultValue={['申悦', '曲晨一']} multiple renderSelectedItem={renderMultipleWithTag('circle')}>
                <For each={list}>{renderCustomOption}</For>
            </Select>
            <Select placeholder="请选择" maxTagCount={2} style={{ width: '280px', 'margin-top': '20px' }} onChange={(v) => console.log(v)} defaultValue={['申悦', '曲晨一']} multiple renderSelectedItem={renderMultipleWithTag('square')}>
                <For each={list}>{renderCustomOption}</For>
            </Select>
        </>
    );
}
