import { cssClasses } from './constants';

export type TimelineMode = 'left' | 'right' | 'center' | 'alternate';
export type TimelineItemPosition = 'left' | 'right';

export function getPosCls(mode: TimelineMode | undefined, position: TimelineItemPosition | undefined, idx: number) {
    const prefixCls = cssClasses.PREFIX;
    if (mode === 'left' || mode === 'right') {
        return `${prefixCls}-item-${mode}`;
    }
    if (position) {
        return `${prefixCls}-item-${position}`;
    }
    if (mode === 'alternate') {
        return idx % 2 === 0 ? `${prefixCls}-item-left` : `${prefixCls}-item-right`;
    }
    return mode === 'center' ? `${prefixCls}-item-left` : '';
}
