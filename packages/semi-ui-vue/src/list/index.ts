import ListItem from './item.vue';
import List from './list.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
const ListWithParts: typeof List & { Item: typeof ListItem } = Object.assign(List, { Item: ListItem });
export default ListWithParts;
export { ListItem };
export type * from './interface';
