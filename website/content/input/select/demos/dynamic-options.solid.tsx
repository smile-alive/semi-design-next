import { For, createSignal } from 'solid-js';
import { Button, Select } from '@fibrae/semi-ui-solid';

export default function SelectDemo() {
    const [options, setOptions] = createSignal([1, 2, 3, 4]);
    const add = () => {
        const length = Math.ceil(Math.random() * 10);
        setOptions(Array.from({ length }, (_, i) => i + 1));
    };
    return (
        <>
            <Select aria-label="数字" style={{ width: '180px' }} placeholder="请选择" value={4}>
                <For each={options()}>{(option) => <Select.Option value={option}>{option}</Select.Option>}</For>
            </Select>
            <br />
            <br />
            <Button onClick={add}>changeOptions Dynamic</Button>
        </>
    );
}
