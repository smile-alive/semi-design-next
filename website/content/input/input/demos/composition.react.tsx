import { useState } from 'react';
import { Input, TextArea } from '@fibrae/semi-ui-react';

export default function InputDemo() {
    const [inputValue, setInputValue] = useState('');
    const [textAreaValue, setTextAreaValue] = useState('');
    const [inputCount, setInputCount] = useState(0);
    const [textAreaCount, setTextAreaCount] = useState(0);

    const handleInputChange = (value: string) => {
        setInputValue(value);
        setInputCount((count) => count + 1);
    };

    const handleTextAreaChange = (value: string) => {
        setTextAreaValue(value);
        setTextAreaCount((count) => count + 1);
    };

    return (
        <div>
            <h4>Input with composition</h4>
            <Input composition value={inputValue} onChange={handleInputChange} placeholder="开启 composition，拼音输入时不会触发 onChange" style={{ width: 300 }} />
            <div style={{ marginTop: 8, color: 'var(--semi-color-text-2)', fontSize: 12 }}>onChange 触发次数: {inputCount}</div>
            <br />
            <br />
            <h4>TextArea with composition</h4>
            <TextArea composition value={textAreaValue} onChange={handleTextAreaChange} placeholder="开启 composition，拼音输入时不会触发 onChange" style={{ width: 300 }} />
            <div style={{ marginTop: 8, color: 'var(--semi-color-text-2)', fontSize: 12 }}>onChange 触发次数: {textAreaCount}</div>
        </div>
    );
}
