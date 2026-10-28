import { useMemo, useState } from 'react';
import { IconClose } from '@fibrae/semi-icons-react';
import { TagInput, Avatar, Button } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    const [value, setValue] = useState(['夏可漫']);
    const list = useMemo(
        () => [
            {
                name: '夏可漫',
                avatar: '/assets/root-web-sites/avatarDemo.jpeg',
            },
            {
                name: '申悦',
                avatar: '/assets/root-web-sites/bf8647bffab13c38772c9ff94bf91a9d.jpg',
            },
            {
                name: '曲晨一',
                avatar: '/assets/root-web-sites/bf8647bffab13c38772c9ff94bf91a9d.jpg',
            },
            {
                name: '文嘉茂',
                avatar: '/assets/root-web-sites/avatarDemo.jpeg',
            },
        ],
        []
    );
    const mapList = useMemo(() => new Map(list.map((item) => [item.name, item])), [list]);

    const renderTagItem = (value: string, index: number, onClose: () => void) => {
        const data = mapList.get(value);
        return (
            <div
                key={index}
                style={{
                    backgroundColor: 'var(--semi-color-info-light-default)',
                    padding: '4px 8px',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 14,
                    marginRight: 10,
                }}
            >
                <Avatar alt="avatar" src={data ? data.avatar : '/assets/placeholder/avatar-a.svg'} size="extra-small" />
                <span style={{ marginLeft: 8 }}>{`${value}@semi.com`}</span>
                <Button theme="borderless" type="tertiary" size="small" icon={<IconClose size="small" />} aria-label={`移除 ${value}`} onClick={onClose} />
            </div>
        );
    };

    return <TagInput value={value} onChange={setValue} renderTagItem={renderTagItem} />;
}
