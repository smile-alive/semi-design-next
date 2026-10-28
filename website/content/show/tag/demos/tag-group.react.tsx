import { TagGroup, type TagProps } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    const tagList: TagProps[] = [
        { color: 'light-blue', children: '抖音' },
        { color: 'cyan', children: '火山' },
        { color: 'violet', children: '剪映' },
        { color: 'white', children: '醒图' },
    ];
    const src = '/assets/placeholder/avatar-a.svg';
    const tagList2: TagProps[] = [
        { color: 'white', children: 'Douyin', avatarSrc: src },
        { color: 'white', children: 'Hotsoon', avatarSrc: src },
        { color: 'white', children: 'Capcut', avatarSrc: src },
        { color: 'white', children: 'Xingtu', avatarSrc: src },
    ];
    const divStyle = {
        backgroundColor: 'var(--semi-color-fill-0)',
        height: 35,
        width: 300,
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        marginBottom: 30,
    };
    const tagGroupStyle = {
        display: 'flex',
        alignItems: 'center',
        width: 350,
    };
    return (
        <>
            <div style={divStyle}>
                <TagGroup maxTagCount={3} style={tagGroupStyle} tagList={tagList} size="large" />
            </div>
            <div style={divStyle}>
                <TagGroup maxTagCount={2} style={tagGroupStyle} tagList={tagList2} size="large" avatarShape="circle" showPopover />
            </div>
        </>
    );
}
