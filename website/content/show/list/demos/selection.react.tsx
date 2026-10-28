import { useState } from 'react';
import { List, Checkbox, Radio, RadioGroup, CheckboxGroup, type CheckboxValue } from '@fibrae/semi-ui-react';

const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数', '第一人称单数'];

const dataSource = data.slice(0, 8);

export default function ListDemo() {
    const [checkboxVal, setCV] = useState<CheckboxValue[]>([data[0]]);
    const [radioVal, setRV] = useState(data[0]);

    return (
        <div style={{ display: 'flex' }}>
            <div style={{ marginRight: 16, width: 280, display: 'flex', flexWrap: 'wrap' }}>
                <CheckboxGroup value={checkboxVal} onChange={(value) => setCV(value)}>
                    <List
                        dataSource={dataSource}
                        className="component-list-demo-booklist"
                        split={false}
                        size="small"
                        style={{ border: '1px solid var(--semi-color-border)', flexBasis: '100%', flexShrink: 0 }}
                        renderItem={(item) => (
                            <List.Item className="list-item">
                                <Checkbox value={item}>{item}</Checkbox>
                            </List.Item>
                        )}
                    />
                </CheckboxGroup>
            </div>
            <div style={{ marginRight: 16, width: 280, display: 'flex', flexWrap: 'wrap' }}>
                <RadioGroup value={radioVal} onChange={(e) => setRV(e.target.value)}>
                    <List
                        className="component-list-demo-booklist"
                        dataSource={dataSource}
                        split={false}
                        size="small"
                        style={{ border: '1px solid var(--semi-color-border)', flexBasis: '100%', flexShrink: 0 }}
                        renderItem={(item) => (
                            <List.Item className="list-item">
                                <Radio value={item}>{item}</Radio>
                            </List.Item>
                        )}
                    />
                </RadioGroup>
            </div>
        </div>
    );
}
