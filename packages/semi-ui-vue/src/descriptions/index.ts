import DescriptionsItem from './descriptions-item.vue';
import Descriptions from './descriptions.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const DescriptionsWithItem: typeof Descriptions & { Item: typeof DescriptionsItem } = Object.assign(Descriptions, {
    Item: DescriptionsItem,
});
export default DescriptionsWithItem;
export { DescriptionsItem };
export type * from './interface';
