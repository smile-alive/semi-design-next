import type { ComputedRef } from 'vue';
import { createContext } from '../../base/index';
import type { TimelineProps } from './interface';

export interface TimelineContextValue {
    classNames: TimelineProps['classNames'];
    styles: TimelineProps['styles'];
}

// A Timeline.Item also works on its own, as a plain li
export const [provideTimelineContext, useTimelineContext] = createContext<ComputedRef<TimelineContextValue>>('Timeline', { optional: true });
