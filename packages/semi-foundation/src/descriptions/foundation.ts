import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

export interface DescriptionsColumn {
    hidden?: boolean;
    span?: number;
}

export default class DescriptionsFoundation<P = Record<string, any>, S = Record<string, any>> extends BaseFoundation<DefaultAdapter<P, S>, P, S> {
    /**
     * Groups the visible columns into rows of `column` spans; a short last row stretches its last item to fill the
     * row. Pure: the caller's column objects are never written to.
     */
    static getHorizontalList<T extends DescriptionsColumn>(columns: T[], column: number) {
        const horizontalList: T[][] = [];
        let itemList: T[] = [];
        let totalSpan = 0;
        const spanOf = (item: T) => item.span || 1;
        for (const item of columns.filter((item) => !item.hidden)) {
            totalSpan += spanOf(item);
            itemList.push(item);
            if (totalSpan >= column) {
                horizontalList.push(itemList);
                itemList = [];
                totalSpan = 0;
            }
        }
        if (itemList.length) {
            const lastItem = itemList.at(-1);
            if (lastItem.span === undefined) {
                const total = itemList.reduce((sum, item) => sum + spanOf(item), 0);
                if (total < column) {
                    itemList = [...itemList.slice(0, -1), { ...lastItem, span: column - total + 1 }];
                }
            }
            horizontalList.push(itemList);
        }
        return horizontalList;
    }
}
