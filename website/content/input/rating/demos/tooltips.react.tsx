import { useState } from 'react';
import { Rating } from '@fibrae/semi-ui-react';

export default function RatingDemo() {
    const [value, setValue] = useState(0);
    const change = (val: number) => setValue(val);
    const desc = ['极差', '较差', '一般', '满意', '非常满意'];
    return (
        <div>
            <span>
                你对获得的帮助是否满意：
                {value ? <span>{desc[value - 1]}</span> : ''}
            </span>
            <br />
            <Rating tooltips={desc} onChange={change} value={value} />
        </div>
    );
}
