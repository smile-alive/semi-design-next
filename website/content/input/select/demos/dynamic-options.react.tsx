import { useState } from 'react';
import { Select, Button } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    let [options, setOptions] = useState([1, 2, 3, 4]);
    function add() {
        let length = Math.ceil(Math.random() * 10);
        let newOptions = Array.from({ length }, (_v, i) => i + 1);
        setOptions(newOptions);
    }
    return (
        <>
            <Select aria-label="数字" style={{ width: '180px' }} placeholder="请选择" value={4}>
                {options.map((option) => (
                    <Select.Option value={option} key={option}>
                        {option}
                    </Select.Option>
                ))}
            </Select>
            <br />
            <br />
            <Button onClick={add}>changeOptions Dynamic</Button>
        </>
    );
}
