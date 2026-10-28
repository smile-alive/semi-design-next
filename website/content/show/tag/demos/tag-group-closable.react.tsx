import { useState } from 'react';
import { TagGroup, type TagGroupProps, type TagProps } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    const defaultList: TagProps[] = [
        { tagKey: '1', color: 'light-blue', children: '抖音', closable: true },
        { tagKey: '3', color: 'cyan', children: '剪映', closable: true },
        { tagKey: '2', color: 'violet', children: '醒图', closable: true },
        { tagKey: '4', color: 'teal', children: '轻颜相机', closable: true },
        { tagKey: '5', color: 'white', children: '飞书', closable: true },
    ];

    const [tagList, setTagList] = useState(defaultList);

    const tagListClick: TagGroupProps['onTagClose'] = (_value, _e, tagKey) => {
        const newTagList = [...tagList];
        const closeTagIndex = newTagList.findIndex((t) => t.tagKey === tagKey);
        newTagList.splice(closeTagIndex, 1);
        setTagList(newTagList);
    };

    return (
        <div
            style={{
                backgroundColor: 'var(--semi-color-fill-0)',
                height: 35,
                width: 300,
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                marginBottom: 30,
            }}
        >
            <TagGroup
                maxTagCount={3}
                showPopover
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: 350,
                }}
                tagList={tagList}
                size="large"
                onTagClose={tagListClick}
            />
        </div>
    );
}
