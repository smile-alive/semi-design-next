import { useEffect, useState } from 'react';
import Announcer from '@fibrae/semi-foundation/utils/announcer';

/** Returns the text of a persistent live region and the function that announces a message through it */
export default function useAnnouncer() {
    const [text, setText] = useState('');
    const [announcer] = useState(() => new Announcer(setText));
    useEffect(() => () => announcer.dispose(), [announcer]);
    return [text, announcer] as const;
}
