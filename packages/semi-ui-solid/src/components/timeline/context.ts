import type { Accessor, JSX } from 'solid-js';
import type { TimelinePart } from '@fibrae/semi-foundation/components/timeline/constants';
import { createContext } from '../../base/index';

export interface TimelineContextValue {
    classNames?: Partial<Record<TimelinePart, string>>;
    styles?: Partial<Record<TimelinePart, JSX.CSSProperties | string>>;
}

export const [TimelineContext, useTimelineContext] = createContext<Accessor<TimelineContextValue>>('Timeline', { defaultValue: () => ({}) });
