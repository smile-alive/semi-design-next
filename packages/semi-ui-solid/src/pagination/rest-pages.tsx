import { createMemo } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/pagination/constants';
import VirtualList, { type VirtualListRowProps } from '../_base/virtual-list';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;
// equals $height-pagination_item in pagination.scss
const ITEM_HEIGHT = 32;
const MAX_VISIBLE_ITEMS = 5;

interface RestPagesData {
    start: number;
    goPage: (page: number) => void;
}

export interface RestPagesProps {
    start: number;
    count: number;
    onSelect: (page: number) => void;
}

/** Pages hidden behind an ellipsis, or all pages of the small size; tens of thousands are possible, so the list is virtualized */
export default function RestPages(props: RestPagesProps) {
    const config = useConfig();
    const locale = useLocale('Pagination');

    const data = createMemo<RestPagesData>(() => ({ start: props.start, goPage: props.onSelect }));

    const RestPageItem = (row: VirtualListRowProps<RestPagesData>) => {
        const page = () => row.data.start + row.index;
        return (
            <button type="button" class={`${prefixCls}-rest-item`} style={row.style} aria-label={locale().locale.pageN.replace('${page}', String(page()))} onClick={() => row.data.goPage(page())}>
                {page()}
            </button>
        );
    };

    return (
        <VirtualList class={`${prefixCls}-rest-list`} style={{ direction: config().direction }} height={ITEM_HEIGHT * Math.min(props.count, MAX_VISIBLE_ITEMS)} itemCount={props.count} itemData={data()} itemSize={ITEM_HEIGHT} width={78}>
            {RestPageItem}
        </VirtualList>
    );
}
