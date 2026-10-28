import { createSignal } from 'solid-js';
import { IconClose } from '@fibrae/semi-icons-solid';
import { Avatar, Button, TagInput } from '@fibrae/semi-ui-solid';

const list = [
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
];
const mapList = new Map(list.map((item) => [item.name, item]));
const fallbackAvatar = '/assets/placeholder/avatar-a.svg';

function renderTagItem(value: string, _index: number, onClose: () => void) {
    const data = mapList.get(value);
    return (
        <div
            style={{
                'background-color': 'var(--semi-color-info-light-default)',
                padding: '4px 8px',
                'border-radius': '12px',
                display: 'flex',
                'align-items': 'center',
                'font-size': '14px',
                'margin-right': '10px',
            }}
        >
            <Avatar alt="avatar" src={data ? data.avatar : fallbackAvatar} size="extra-small" />
            <span style={{ 'margin-left': '8px' }}>{`${value}@semi.com`}</span>
            <Button theme="borderless" type="tertiary" size="small" icon={<IconClose size="small" />} aria-label={`移除 ${value}`} onClick={onClose} />
        </div>
    );
}

export default function TagInputDemo() {
    const [tags, setTags] = createSignal(['夏可漫']);
    return <TagInput value={tags()} onChange={(v) => setTags(v)} renderTagItem={renderTagItem} />;
}
