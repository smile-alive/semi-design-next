import { useState } from 'react';
import { Select, TextArea } from '@fibrae/semi-ui-react';

interface Item {
    value: string;
    label: string;
    type: number;
}

export default function SelectDemo() {
    const list: Item[] = [
        { value: 'douyin', label: '抖音', type: 1 },
        { value: 'ulikecam', label: '轻颜相机', type: 2 },
        { value: 'jianying', label: '剪映', type: 3 },
        { value: 'toutiao', label: '今日头条', type: 4 },
    ];
    const [cbValue, setCbValue] = useState<Item>();
    const [multipleCbValue, setMultipleCbValue] = useState<Item[]>();

    const onChange = (value?: Item) => {
        setCbValue(value);
        console.log(value);
    };

    const onMultipleChange = (value: Item[]) => {
        setMultipleCbValue(value);
        console.log(value);
    };

    return (
        <div>
            <div>
                <Select aria-label="单选" style={{ width: 150 }} onChangeWithObject optionList={list} placeholder="单选" defaultValue={list[0]} onChange={onChange} />
                <h4 id="select-on-change-with-object-single">onChange回调:</h4>
                <TextArea aria-labelledby="select-on-change-with-object-single" style={{ width: 320, marginBottom: 48 }} autosize value={JSON.stringify(cbValue)} rows={2} />
            </div>
            <div>
                <Select aria-label="多选" style={{ width: 320 }} onChangeWithObject multiple optionList={list} onChange={onMultipleChange} placeholder="多选" />
                <h4 id="select-on-change-with-object-multiple">onChange回调:</h4>
                <TextArea aria-labelledby="select-on-change-with-object-multiple" style={{ width: 320 }} autosize value={JSON.stringify(multipleCbValue)} />
            </div>
        </div>
    );
}
