import { createSignal } from 'solid-js';
import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-solid';
import { Button, List } from '@fibrae/semi-ui-solid';

const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数', '第一人称单数'];

export default function ListDemo() {
    const [list, setList] = createSignal(data.slice(0, 8));

    const updateList = (item?: string) => {
        if (item) {
            setList(list().filter((i) => item !== i));
        } else {
            setList(list().concat(data.slice(list().length, list().length + 1)));
        }
    };

    return (
        <div>
            <div style={{ 'margin-right': '16px', width: '280px', display: 'flex', 'flex-wrap': 'wrap', border: '1px solid var(--semi-color-border)' }}>
                <List
                    class="component-list-demo-booklist"
                    dataSource={list()}
                    split={false}
                    size="small"
                    style={{ 'flex-basis': '100%', 'flex-shrink': '0', 'border-bottom': '1px solid var(--semi-color-border)' }}
                    renderItem={(item) => (
                        <li style={{ margin: '4px' }} class="list-item">
                            <Button type="danger" theme="borderless" aria-label={`删除${item}`} icon={<IconMinusCircle />} onClick={() => updateList(item)} style={{ 'margin-right': '4px' }} />
                            {item}
                        </li>
                    )}
                />
                <div style={{ margin: '4px', 'font-size': '14px' }}>
                    <Button theme="borderless" aria-label="新增书籍" icon={<IconPlusCircle />} onClick={() => updateList()} style={{ 'margin-right': '4px', color: 'var(--semi-color-info)' }} />
                    新增书籍
                </div>
            </div>
        </div>
    );
}
