import { IconLikeHeart } from '@fibrae/semi-icons-react';
import { Rating } from '@fibrae/semi-ui-react';

export default function RatingDemo() {
    return (
        <div>
            <Rating style={{ color: 'red' }} character={<IconLikeHeart size="extra-large" />} defaultValue={3} />
            <br />
            <br />
            <Rating style={{ color: 'red' }} size={48} allowHalf character={<IconLikeHeart style={{ fontSize: 48 }} />} defaultValue={3} />
            <br />
            <br />
            <Rating character="赞" size={18} defaultValue={3} />
            <br />
            <br />
            <Rating count={10} defaultValue={6} />
        </div>
    );
}
