import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/select/constants';
import type { BasicOptionProps } from '@fibrae/semi-foundation/select/option-foundation';
import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
import { IconTick } from '@fibrae/semi-icons-react';
import Highlight from '../highlight';
import useLocale from '../locale/use-locale';

export interface OptionProps extends BasicOptionProps {
    [x: string]: any;
    value?: string | number;
    label?: string | number | React.ReactNode;
    children?: React.ReactNode;
    disabled?: boolean;
    showTick?: boolean;
    className?: string;
    style?: React.CSSProperties;
    /** The row aria-activedescendant points at; AutoComplete marks it aria-selected */
    current?: boolean;
}

function Option({ children, disabled, value, selected, label, empty, emptyContent, onSelect, focused, showTick, className, style, onMouseEnter, prefixCls = cssClasses.PREFIX_OPTION, renderOptionItem, inputValue, semiOptionId, current, ...rest }: OptionProps): React.ReactNode {
    const { locale } = useLocale('Select');

    const optionClassName = clsx(prefixCls, {
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-selected`]: selected,
        [`${prefixCls}-focused`]: focused,
        [`${prefixCls}-empty`]: empty,
        [className]: className,
    });

    const onClick = (event: React.MouseEvent) => {
        if (!disabled) {
            onSelect({ ...rest, value, label: label || children }, event);
        }
    };

    if (empty) {
        if (emptyContent === null) {
            return null;
        }
        return (
            <div className={optionClassName} x-semi-prop="emptyContent">
                {emptyContent || locale.emptyText}
            </div>
        );
    }

    if (typeof renderOptionItem === 'function') {
        const customRenderClassName = clsx(className, {
            [`${prefixCls}-custom`]: true,
            [`${prefixCls}-custom-selected`]: selected,
        });
        return renderOptionItem({
            id: semiOptionId,
            disabled,
            focused,
            selected,
            style,
            label,
            value,
            inputValue,
            onMouseEnter: (e: React.MouseEvent) => onMouseEnter(e),
            onClick,
            className: customRenderClassName,
            ...rest,
        });
    }

    return (
        // no focus on the option: the trigger drives it via aria-activedescendant
        <div id={semiOptionId} className={optionClassName} style={style} aria-disabled={disabled ? 'true' : 'false'} aria-selected={selected || current ? 'true' : 'false'} role="option" onClick={onClick} onMouseEnter={(e) => onMouseEnter?.(e)} {...getDataAttr(rest)}>
            {showTick && (
                <div className={`${prefixCls}-icon`}>
                    <IconTick />
                </div>
            )}
            {typeof children === 'string' ? <div className={`${prefixCls}-text`}>{inputValue ? <Highlight highlightClassName={`${prefixCls}-keyword`} searchWords={[inputValue]} sourceString={children} /> : children}</div> : children}
        </div>
    );
}

export default Object.assign(memo(Option), { elementType: 'Select.Option' });
