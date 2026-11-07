import { useRef, useState } from 'react';

// State plus a getter for event handlers and effects, which may run with a stale render's closure
// https://github.com/facebook/react/issues/14543
export default function useStateWithGetter(initial?: any) {
    const [state, setState] = useState(initial);
    const ref = useRef(state);
    const set = (value: any) => {
        ref.current = value;
        setState(value);
    };
    const get = () => ref.current;
    return [state, set, get] as const;
}
