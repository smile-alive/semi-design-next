import { Rating } from '@fibrae/semi-ui-react';

export default function RatingDemo() {
    return (
        <div>
            <Rating defaultValue={5} />
            <br />
            <br />
            <Rating size="small" defaultValue={5} />
        </div>
    );
}
