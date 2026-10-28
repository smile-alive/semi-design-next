import { Space, Tag } from '@fibrae/semi-ui-solid';

const src = '/assets/placeholder/avatar-a.svg';

export default function TagDemo() {
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
