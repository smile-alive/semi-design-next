import { createSignal } from 'solid-js';
import { TagGroup, type TagGroupItem, type TagGroupProps } from '@fibrae/semi-ui-solid';

const defaultList: TagGroupItem[] = [
    { tagKey: '1', color: 'light-blue', children: '抖音', closable: true },
    { tagKey: '3', color: 'cyan', children: '剪映', closable: true },
    { tagKey: '2', color: 'violet', children: '醒图', closable: true },
    { tagKey: '4', color: 'teal', children: '轻颜相机', closable: true },
    { tagKey: '5', color: 'white', children: '飞书', closable: true },
];

export default function TagDemo() {
    const [tagList, setTagList] = createSignal(defaultList);

    const tagListClick: TagGroupProps['onTagClose'] = (_tagChildren, _e, tagKey) => {
        setTagList(tagList().filter((t) => t.tagKey !== tagKey));
    };

    return (
        <div
            style={{
                'background-color': 'var(--semi-color-fill-0)',
                height: '35px',
                width: '300px',
                display: 'flex',
                'align-items': 'center',
                padding: '0 10px',
                'margin-bottom': '30px',
            }}
        >
            <TagGroup
                maxTagCount={3}
                showPopover
                style={{
                    display: 'flex',
                    'align-items': 'center',
                    width: '350px',
                }}
                tagList={tagList()}
                size="large"
                onTagClose={tagListClick}
            />
        </div>
    );
}
