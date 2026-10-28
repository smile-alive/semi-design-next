import { useState } from 'react';
import { Slider, Button } from '@fibrae/semi-ui-react';

export default function SliderDemo() {
    const [value, setValue] = useState(10);

    const changeValue = () => {
        setValue(value + 10);
    };

    return (
        <div>
            <Button onClick={changeValue} style={{ marginRight: 20 }}>
                点击改变value值
            </Button>
            <br />
            <br />
            <Slider aria-label="受控滑块" value={value} />
        </div>
    );
}
