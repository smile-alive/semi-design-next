import type React from 'react';
import type { TimelinePart } from '@fibrae/semi-foundation/components/timeline/constants';
import { createContext } from '../../base/index';

export interface TimelineContextValue {
    classNames?: Partial<Record<TimelinePart, string>>;
    styles?: Partial<Record<TimelinePart, React.CSSProperties>>;
}

export const [TimelineContext, useTimelineContext] = createContext<TimelineContextValue>('Timeline', { defaultValue: {} });
