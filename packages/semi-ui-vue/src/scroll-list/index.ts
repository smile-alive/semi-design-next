import ScrollItem from './scroll-item.vue';
import ScrollList from './scroll-list.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const ScrollListWithItem: typeof ScrollList & { Item: typeof ScrollItem } = Object.assign(ScrollList, {
    Item: ScrollItem,
});
export default ScrollListWithItem;
export { default as ScrollItem } from './scroll-item.vue';
export type * from './interface';
