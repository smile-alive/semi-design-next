import type React from 'react';
import { useState } from 'react';
import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
import ReactResizeObserver, { type ResizeEntry } from '../resize-observer';

export interface AutoSizerProps {
    defaultHeight?: number | string;
    defaultWidth?: number | string;
    children?: (info: { width: string | number; height: string | number }) => React.ReactNode;
}

const prefixcls = cssClasses.PREFIX;
const wrapperCls = `${prefixcls}-auto-wrapper`;

/** Passes a pixel height to its children: `defaultHeight` when it is a number, else the parent's content height */
function AutoSizer({ children, defaultWidth = '100%', defaultHeight = '100%' }: AutoSizerProps) {
    const [height, setHeight] = useState<number | string>(defaultHeight || 0);

    // no children before the first measurement, as in https://github.com/bvaughn/react-virtualized-auto-sizer
    const bailoutOnChildren = height === 0 || typeof height !== 'number';

    const onResize = (entries: ResizeEntry[]) => {
        // ResizeObserver delivers only changed targets, so the parent's position in entries is not fixed
        const target = entries?.find((entry) => !(entry.target as HTMLElement).classList.contains(wrapperCls))?.target as HTMLElement;
        if (target) {
            const style = window.getComputedStyle(target);
            const paddingTop = parseInt(style.paddingTop, 10) || 0;
            const paddingBottom = parseInt(style.paddingBottom, 10) || 0;
            setHeight((target.offsetHeight || 0) - paddingTop - paddingBottom);
        }
    };

    return (
        <ReactResizeObserver observeParent onResize={onResize}>
            <div className={wrapperCls} style={{ height: defaultHeight, overflow: 'visible' }}>
                {!bailoutOnChildren && children({ height, width: defaultWidth })}
            </div>
        </ReactResizeObserver>
    );
}

export default AutoSizer;
