import { Rating } from '@fibrae/semi-ui-react';

export default function RatingDemo() {
    return (
        <div>
            <span>允许再次点击清除</span>
            <br />
            <Rating allowClear defaultValue={3} />
            <br />
            <br />
            <span>禁止再次点击清除</span>
            <br />
            <Rating allowClear={false} defaultValue={3} />
        </div>
    );
}
