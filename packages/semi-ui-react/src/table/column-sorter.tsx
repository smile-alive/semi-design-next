import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/table/constants';
import { getNextSortOrder } from '@fibrae/semi-foundation/table/utils';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { IconCaretup, IconCaretdown } from '@fibrae/semi-icons-react';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';
import type { SortIcon, SortOrder } from './interface';

export interface ColumnSorterProps {
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    prefixCls?: string;
    sortOrder?: SortOrder;
    title?: React.ReactNode;
    sortIcon?: SortIcon;
    showTooltip?: boolean;
}

/**
 * The sort button of a column header: named by the column title, with the sort state as aria-sort on the header cell.
 * When the whole title sorts, the click handler sits on the header cell and the button's click reaches it by bubbling.
 */
function ColumnSorter({ prefixCls = cssClasses.PREFIX, onClick = noop, sortOrder = false, style, title, sortIcon, showTooltip = false }: ColumnSorterProps) {
    const { locale } = useLocale('Table');

    const iconBtnSize = 'default';

    const upCls = clsx(`${prefixCls}-column-sorter-up`, {
        on: sortOrder === strings.SORT_DIRECTIONS[0],
    });

    const downCls = clsx(`${prefixCls}-column-sorter-down`, {
        on: sortOrder === strings.SORT_DIRECTIONS[1],
    });

    const renderSortIcon = () => {
        if (typeof sortIcon === 'function') {
            return sortIcon({ sortOrder });
        }
        return (
            <span className={`${prefixCls}-column-sorter`} style={style} aria-hidden>
                <span className={`${upCls}`}>
                    <IconCaretup size={iconBtnSize} />
                </span>
                <span className={`${downCls}`}>
                    <IconCaretdown size={iconBtnSize} />
                </span>
            </span>
        );
    };

    const sorter = (
        <button type="button" className={`${prefixCls}-column-sorter-wrapper`} onClick={onClick}>
            {title}
            {renderSortIcon()}
        </button>
    );

    return showTooltip ? <Tooltip content={locale[getNextSortOrder(sortOrder)]}>{sorter}</Tooltip> : sorter;
}

export default memo(ColumnSorter);
