import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { type CheckboxEvent, type CheckboxProps, Checkbox } from '../checkbox';

export interface TableSelectionCellProps {
    getCheckboxProps?: () => CheckboxProps;
    onChange?: (checked: boolean, e: CheckboxEvent) => void;
    selected?: boolean;
    disabled?: boolean;
    indeterminate?: boolean; // Intermediate state, shown as a solid horizontal line
    prefixCls?: string;
    className?: string;
    'aria-label'?: React.AriaAttributes['aria-label'];
}

export default function TableSelectionCell(props: TableSelectionCellProps) {
    const { selected, getCheckboxProps, indeterminate, disabled = false, prefixCls = cssClasses.PREFIX, className, onChange = noop } = props;

    let checkboxProps: CheckboxProps = {
        onChange: (e: CheckboxEvent) => onChange(e.target.checked, e),
        disabled,
        indeterminate,
        checked: selected,
    };

    if (typeof getCheckboxProps === 'function') {
        checkboxProps = { ...checkboxProps, ...getCheckboxProps() };
    }

    const wrapCls = clsx(
        `${prefixCls}-selection-wrap`,
        {
            [`${prefixCls}-selection-disabled`]: disabled,
        },
        className
    );

    return (
        <span className={wrapCls}>
            <Checkbox aria-label={props['aria-label']} {...checkboxProps} />
        </span>
    );
}
