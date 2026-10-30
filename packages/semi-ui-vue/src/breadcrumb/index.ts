import BreadcrumbItem from './breadcrumb-item.vue';
import Breadcrumb from './breadcrumb.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const BreadcrumbWithItem: typeof Breadcrumb & { Item: typeof BreadcrumbItem } = Object.assign(Breadcrumb, {
    Item: BreadcrumbItem,
});
export default BreadcrumbWithItem;
export { default as BreadcrumbItem } from './breadcrumb-item.vue';
export type * from './interface';
