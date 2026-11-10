import { Select } from '@fibrae/semi-ui-solid';

const optionList = [
    { value: 'video', label: '短视频' },
    { value: 'camera', label: '相机' },
    { value: 'editing', label: '剪辑' },
    { value: 'news', label: '资讯' },
];

export default function SelectDemo() {
    return (
        <>
            <Select aria-label="业务线" style={{ width: '400px' }} optionList={optionList} allowCreate multiple filter onChange={(v) => console.log(v)} defaultActiveFirstOption />
            <br />
            <br />
            <Select
                aria-label="业务线"
                style={{ width: '400px' }}
                optionList={optionList}
                allowCreate
                multiple
                filter
                placeholder="With renderCreateItem"
                renderCreateItem={(input, _isFocus, style) => <div style={{ padding: '10px', ...style }}>Create Item：{input}</div>}
                onChange={(v) => console.log(v)}
                defaultActiveFirstOption
            />
        </>
    );
}
