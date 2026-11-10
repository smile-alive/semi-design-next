import { type JSX, Show, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/components/table/constants';
import { getNextSortOrder } from '@fibrae/semi-foundation/components/table/utils';
import { IconCaretdown, IconCaretup } from '@fibrae/semi-icons-solid';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';
import type { SortIcon, SortOrder } from './interface';

export interface ColumnSorterProps {
    style?: JSX.CSSProperties;
    onClick?: (e: MouseEvent) => void;
    prefixCls?: string;
    sortOrder?: SortOrder;
    title?: JSX.Element;
    sortIcon?: SortIcon;
    showTooltip?: boolean;
}

// When the whole title sorts, the click handler sits on the header cell and the button's click reaches it by bubbling.
export default function ColumnSorter(props: ColumnSorterProps) {
    const locale = useLocale('Table');

    const prefixCls = () => props.prefixCls ?? cssClasses.PREFIX;

    const sortOrder = () => props.sortOrder ?? false;

    const renderSortIcon = () => {
        const sortIcon = props.sortIcon;
        if (typeof sortIcon === 'function') {
            return untrack(() =>
                sortIcon({
                    get sortOrder() {
                        return sortOrder();
                    },
                })
            );
        }
        return (
            <span class={`${prefixCls()}-column-sorter`} style={props.style} aria-hidden="true">
                <span class={clsx(`${prefixCls()}-column-sorter-up`, { on: sortOrder() === strings.SORT_DIRECTIONS[0] })}>
                    <IconCaretup size="default" />
                </span>
                <span class={clsx(`${prefixCls()}-column-sorter-down`, { on: sortOrder() === strings.SORT_DIRECTIONS[1] })}>
                    <IconCaretdown size="default" />
                </span>
            </span>
        );
    };

    const handleClick = (e: MouseEvent) => props.onClick?.(e);

    const renderButton = (own: JSX.ButtonHTMLAttributes<HTMLButtonElement> = {}) => (
        // a useFullRender title function or an empty title leaves the button only the icon; the next sort action then names it
        <button {...own} type="button" class={`${prefixCls()}-column-sorter-wrapper`} aria-label={props.title == null ? locale().locale[getNextSortOrder(sortOrder())] : undefined} onClick={handleClick}>
            {props.title}
            {renderSortIcon()}
        </button>
    );

    return (
        <Show when={props.showTooltip} fallback={renderButton()}>
            <Tooltip content={locale().locale[getNextSortOrder(sortOrder())]}>{(getTriggerProps) => renderButton(getTriggerProps())}</Tooltip>
        </Show>
    );
}
