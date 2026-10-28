import { useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import useResizeObserver from '../_base/use-resize-observer';

/**
 * The scrolling time grid shared by the day, week and range views: measures the grid height events are placed
 * against and applies the initial `scrollTop`. A grid mounted in a hidden container (an inactive Tabs pane) measures
 * 0 and cannot scroll, so both are redone once it becomes visible.
 */
export default function useScrollGrid(scrollTop: number) {
    const rootRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollHeight, setScrollHeight] = useState(0);
    const applyScrollTop = useEffectEvent(() => {
        rootRef.current.scrollTop = scrollTop;
    });
    const scrollPending = useRef(false);
    useLayoutEffect(() => {
        const height = scrollRef.current.scrollHeight;
        setScrollHeight(height);
        applyScrollTop();
        // the write above is lost while the grid has no layout box
        scrollPending.current = height === 0;
    }, []);
    useResizeObserver(scrollRef, () => {
        const height = scrollRef.current.scrollHeight;
        setScrollHeight(height);
        if (scrollPending.current && height > 0) {
            scrollPending.current = false;
            rootRef.current.scrollTop = scrollTop;
        }
    });
    return { rootRef, scrollRef, scrollHeight };
}
