import { createToken } from '../_base/token';
import type { TimelineItemProps } from './interface';

export const TIMELINE_ITEM = 'Timeline.Item';

// Timeline renders the li from this token and adds the side class by position.
export default function Item(props: TimelineItemProps) {
    return createToken(TIMELINE_ITEM, props);
}
