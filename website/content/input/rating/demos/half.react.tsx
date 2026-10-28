import { Rating } from '@fibrae/semi-ui-react';

export default function RatingDemo() {
    return (
        <div>
            <Rating allowHalf defaultValue={3.5} />
            <br />
            <Rating allowHalf defaultValue={3.65} disabled />
        </div>
    );
}
