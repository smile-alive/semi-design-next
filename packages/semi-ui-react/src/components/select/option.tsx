import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses, type OptionPart, type SelectPart } from '@fibrae/semi-foundation/components/select/constants';
import type { BasicOptionProps, SelectRawValue } from '@fibrae/semi-foundation/components/select/option-foundation';
import { getDataAttr } from '@fibrae/semi-foundation/utils';
import { IconTick } from '@fibrae/semi-icons-react';
import Highlight from '../highlight';
import useLocale from '../locale/use-locale';

export interface OptionProps<V extends SelectRawValue = SelectRawValue> extends BasicOptionProps {
    [x: string]: any;
    value?: V;
    label?: string | number | React.ReactNode;
    children?: React.ReactNode;
    disabled?: boolean;
    showTick?: boolean;
    className?: string;
    classNames?: Partial<Record<OptionPart, string>>;
    style?: React.CSSProperties;
    styles?: Partial<Record<OptionPart, React.CSSProperties>>;
}

/** Set by Select and AutoComplete, kept out of the public OptionProps */
export interface OptionInternalProps extends OptionProps {
    /** The row aria-activedescendant points at; AutoComplete marks it aria-selected */
    current?: boolean;
    /** The `item*` parts of the parent, applied before the option's own */
    parentClassNames?: Partial<Record<SelectPart, string>>;
    parentStyles?: Partial<Record<SelectPart, React.CSSProperties>>;
}

function Option(props: OptionProps): React.ReactNode {
    const {
        children,
        disabled,
        value,
        selected,
        label,
        empty,
        emptyContent,
        onSelect,
        focused,
        showTick,
        className,
        classNames,
        style,
        styles,
        onMouseEnter,
        prefixCls = cssClasses.PREFIX_OPTION,
        renderOptionItem,
        inputValue,
        semiOptionId,
        current,
        parentClassNames,
        parentStyles,
        ...rest
    } = props as OptionInternalProps;

    const { locale } = useLocale('Select');

    const optionClassName = clsx(
        prefixCls,
        {
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-selected`]: selected,
            [`${prefixCls}-focused`]: focused,
            [`${prefixCls}-empty`]: empty,
        },
        parentClassNames?.item,
        className
    );

    const optionStyle = { ...parentStyles?.item, ...style };

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
            <div className={optionClassName} style={style} x-semi-prop="emptyContent">
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
        <div id={semiOptionId} className={optionClassName} style={optionStyle} aria-disabled={disabled ? 'true' : 'false'} aria-selected={selected || current ? 'true' : 'false'} role="option" onClick={onClick} onMouseEnter={(e) => onMouseEnter?.(e)} {...getDataAttr(rest)}>
            {showTick && (
                <div className={clsx(`${prefixCls}-icon`, parentClassNames?.itemIcon, classNames?.icon)} style={{ ...parentStyles?.itemIcon, ...styles?.icon }}>
                    <IconTick />
                </div>
            )}
            {typeof children === 'string' ? (
                <div className={clsx(`${prefixCls}-text`, parentClassNames?.itemContent, classNames?.content)} style={{ ...parentStyles?.itemContent, ...styles?.content }}>
                    {inputValue ? <Highlight classNames={{ highlight: `${prefixCls}-keyword` }} searchWords={[inputValue]} sourceString={children} /> : children}
                </div>
            ) : (
                children
            )}
        </div>
    );
}

export default /* @__PURE__ */ Object.assign(memo(Option), { elementType: 'Select.Option' });
