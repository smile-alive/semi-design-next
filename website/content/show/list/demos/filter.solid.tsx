import { createSignal } from 'solid-js';
import { IconSearch } from '@fibrae/semi-icons-solid';
import { Input, List } from '@fibrae/semi-ui-solid';

const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚'];

export default function ListDemo() {
    const [list, setList] = createSignal(data);

    const onSearch = (string?: string) => {
        setList(string ? data.filter((item) => item.includes(string)) : data);
    };

    return (
        <div>
            <div style={{ 'margin-right': '16px', width: '280px', display: 'flex', 'flex-wrap': 'wrap', border: '1px solid var(--semi-color-border)' }}>
                <List
                    class="component-list-demo-booklist"
                    dataSource={list()}
                    split={false}
                    header={
                        <Input
                            onCompositionEnd={(event) => onSearch(event.currentTarget.value)}
                            onChange={(value) => {
                                if (!value) {
                                    onSearch();
                                }
                            }}
                            placeholder="搜索"
                            prefix={<IconSearch />}
                        />
                    }
                    size="small"
                    style={{ 'flex-basis': '100%', 'flex-shrink': '0', 'border-bottom': '1px solid var(--semi-color-border)' }}
                    renderItem={(item) => <List.Item class="list-item">{item}</List.Item>}
                />
            </div>
        </div>
    );
}
