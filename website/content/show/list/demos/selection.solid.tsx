import { createSignal } from 'solid-js';
import { Checkbox, CheckboxGroup, List, Radio, RadioGroup, type CheckboxValue } from '@fibrae/semi-ui-solid';

const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数', '第一人称单数'];

const dataSource = data.slice(0, 8);
const listStyle = { border: '1px solid var(--semi-color-border)', 'flex-basis': '100%', 'flex-shrink': '0' };

export default function ListDemo() {
    const [checkboxVal, setCV] = createSignal<CheckboxValue[]>([data[0]]);
    const [radioVal, setRV] = createSignal(data[0]);

    return (
        <div style={{ display: 'flex' }}>
            <div style={{ 'margin-inline-end': '16px', width: '280px', display: 'flex', 'flex-wrap': 'wrap' }}>
                <CheckboxGroup aria-label="书单多选" value={checkboxVal()} onChange={(value) => setCV(value)}>
                    <List
                        dataSource={dataSource}
                        class="component-list-demo-booklist"
                        split={false}
                        size="small"
                        style={listStyle}
                        renderItem={(item) => (
                            <List.Item class="list-item">
                                <Checkbox value={item}>{item}</Checkbox>
                            </List.Item>
                        )}
                    />
                </CheckboxGroup>
            </div>
            <div style={{ 'margin-inline-end': '16px', width: '280px', display: 'flex', 'flex-wrap': 'wrap' }}>
                <RadioGroup aria-label="书单单选" value={radioVal()} onChange={(event) => setRV(event.target.value)}>
                    <List
                        class="component-list-demo-booklist"
                        dataSource={dataSource}
                        split={false}
                        size="small"
                        style={listStyle}
                        renderItem={(item) => (
                            <List.Item class="list-item">
                                <Radio value={item}>{item}</Radio>
                            </List.Item>
                        )}
                    />
                </RadioGroup>
            </div>
        </div>
    );
}
