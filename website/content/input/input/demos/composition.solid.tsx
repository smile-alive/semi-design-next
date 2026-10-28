import { createSignal } from 'solid-js';
import { Input, TextArea } from '@fibrae/semi-ui-solid';

const style = { width: '300px' };
const counterStyle = { 'margin-top': '8px', color: 'var(--semi-color-text-2)', 'font-size': '12px' };

export default function InputDemo() {
    const [inputValue, setInputValue] = createSignal('');
    const [textAreaValue, setTextAreaValue] = createSignal('');
    const [inputCount, setInputCount] = createSignal(0);
    const [textAreaCount, setTextAreaCount] = createSignal(0);

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
            <Input composition value={inputValue()} onChange={handleInputChange} placeholder="开启 composition，拼音输入时不会触发 onChange" style={style} />
            <div style={counterStyle}>onChange 触发次数: {inputCount()}</div>
            <br />
            <br />
            <h4>TextArea with composition</h4>
            <TextArea composition value={textAreaValue()} onChange={handleTextAreaChange} placeholder="开启 composition，拼音输入时不会触发 onChange" style={style} />
            <div style={counterStyle}>onChange 触发次数: {textAreaCount()}</div>
        </div>
    );
}
