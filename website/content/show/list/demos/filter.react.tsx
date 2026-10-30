import { useState } from 'react';
import { IconSearch } from '@fibrae/semi-icons-react';
import { List, Input } from '@fibrae/semi-ui-react';

export default function ListDemo() {
    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚'];

    const [list, setList] = useState(data);

    const onSearch = (string?: string) => {
        let newList: string[];
        if (string) {
            newList = data.filter((item) => item.includes(string));
        } else {
            newList = data;
        }
        setList(newList);
    };

    return (
        <div>
            <div
                style={{
                    marginRight: 16,
                    width: 280,
                    display: 'flex',
                    flexWrap: 'wrap',
                    border: '1px solid var(--semi-color-border)',
                }}
            >
                <List
                    className="component-list-demo-booklist"
                    dataSource={list}
                    split={false}
                    header={<Input onCompositionEnd={(v) => v.target instanceof HTMLInputElement && onSearch(v.target.value)} onChange={(v) => (!v ? onSearch() : null)} placeholder="搜索" prefix={<IconSearch />} />}
                    size="small"
                    style={{ flexBasis: '100%', flexShrink: 0, borderBottom: '1px solid var(--semi-color-border)' }}
                    renderItem={(item) => <List.Item className="list-item">{item}</List.Item>}
                />
            </div>
        </div>
    );
}
