import TimelineItem from './timeline-item.vue';
import Timeline from './timeline.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const TimelineWithItem: typeof Timeline & { Item: typeof TimelineItem } = Object.assign(Timeline, {
    Item: TimelineItem,
});
export default TimelineWithItem;
export { TimelineItem };
export type * from './interface';
