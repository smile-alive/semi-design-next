import { Tag, Space } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    const src = '/assets/placeholder/avatar-a.svg';
    return (
        <Space vertical align="start">
            <Tag avatarSrc={src}>焦锐志</Tag>
            <Tag avatarSrc={src} size="large">
                焦锐志
            </Tag>
            <Tag avatarSrc={src} size="large" closable>
                焦锐志
            </Tag>
            <Tag avatarSrc={src} avatarShape="circle">
                焦锐志
            </Tag>
            <Tag avatarSrc={src} avatarShape="circle" size="large">
                焦锐志
            </Tag>
            <Tag avatarSrc={src} avatarShape="circle" size="large" closable>
                焦锐志
            </Tag>
        </Space>
    );
}
