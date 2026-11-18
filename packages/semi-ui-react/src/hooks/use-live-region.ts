import { useEffect, useState } from 'react';
import Announcer from '@fibrae/semi-foundation/utils/announcer';

export default function useLiveRegion() {
    const [text, setText] = useState('');
    const [announcer] = useState(() => new Announcer(setText));
    useEffect(() => () => announcer.dispose(), [announcer]);
    return [text, announcer] as const;
}
