import { useState } from 'react';
import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-react';
import { List, Button } from '@fibrae/semi-ui-react';

export default function ListDemo() {
    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数', '第一人称单数'];

    const [list, setList] = useState(data.slice(0, 8));

    const updateList = (item?: string) => {
        let newList: string[];
        if (item) {
            newList = list.filter((i) => item !== i);
        } else {
            newList = list.concat(data.slice(list.length, list.length + 1));
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
                    size="small"
                    style={{ flexBasis: '100%', flexShrink: 0, borderBottom: '1px solid var(--semi-color-border)' }}
                    renderItem={(item) => (
                        <li style={{ margin: 4 }} className="list-item">
                            <Button type="danger" theme="borderless" aria-label={`删除${item}`} icon={<IconMinusCircle />} onClick={() => updateList(item)} style={{ marginRight: 4 }} />
                            {item}
                        </li>
                    )}
                />
                <div style={{ margin: 4, fontSize: 14 }}>
                    <Button theme="borderless" aria-label="新增书籍" icon={<IconPlusCircle />} onClick={() => updateList()} style={{ marginRight: 4, color: 'var(--semi-color-info)' }} />
                    新增书籍
                </div>
            </div>
        </div>
    );
}
