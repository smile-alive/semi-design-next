import { createToken } from '../_base/token';
import type { TimelineItemProps } from './interface';

export const TIMELINE_ITEM = 'Timeline.Item';

export default function Item(props: TimelineItemProps) {
    return createToken(TIMELINE_ITEM, props);
}
