import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'toutiao', label: '今日头条' },
    ];
    return (
        <>
            <Select aria-label="业务线" style={{ width: 400 }} optionList={optionList} allowCreate multiple filter onChange={(v) => console.log(v)} defaultActiveFirstOption />
            <br />
            <br />
            <Select
                aria-label="业务线"
                style={{ width: 400 }}
                optionList={optionList}
                allowCreate
                multiple
                filter
                placeholder="With renderCreateItem"
                renderCreateItem={(input, _isFocus, style) => <div style={{ padding: 10, ...style }}>Create Item：{input}</div>}
                onChange={(v) => console.log(v)}
                defaultActiveFirstOption
            />
        </>
    );
}
