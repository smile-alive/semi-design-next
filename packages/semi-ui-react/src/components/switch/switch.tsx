import type React from 'react';
import clsx from 'clsx';
import { omitBy, pickBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/components/switch/constants';
import SwitchFoundation, { type SwitchAdapter, type SwitchState } from '@fibrae/semi-foundation/components/switch/foundation';
import { isAriaKey, type Size } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/switch/switch.scss';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import Spin from '../spin';

type Foundation = SwitchFoundation<SwitchProps, React.ChangeEvent<HTMLInputElement>>;
type Adapter = SwitchAdapter<SwitchProps, React.ChangeEvent<HTMLInputElement>>;

export interface SwitchProps extends ElementProps<'div', 'onChange'> {
    defaultChecked?: boolean;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
    loading?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onMouseEnter?: (e: React.MouseEvent) => any;
    onMouseLeave?: (e: React.MouseEvent) => any;
    size?: Size;
    checkedText?: React.ReactNode;
    uncheckedText?: React.ReactNode;
    id?: string;
    /** Attached to the native control */
    name?: string;
    /** Attached to the native control */
    tabIndex?: number;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

export type { SwitchState } from '@fibrae/semi-foundation/components/switch/foundation';

const defaultProps = {
    disabled: false,
    className: '',
    loading: false,
    size: 'default',
} satisfies Partial<SwitchProps>;

export default function Switch(rawProps: SwitchProps) {
    const props = useDefaultProps('Switch', rawProps, defaultProps);

    const {
        ref,
        className,
        style,
        onMouseEnter,
        onMouseLeave,
        size,
        checkedText,
        uncheckedText,
        loading,
        disabled,
        id,
        name,
        tabIndex,
        autoFocus,
        defaultChecked,
        checked: checkedProp,
        onChange,
        // injected by Form, not DOM attributes
        validateStatus,
        insetLabel,
        insetLabelId,
        ...others
    } = props as SwitchProps & { validateStatus?: unknown; insetLabel?: unknown; insetLabelId?: unknown };

    const [foundation, state] = useFoundation<Foundation, Adapter, SwitchProps, SwitchState>(
        SwitchFoundation,
        props,
        () => SwitchFoundation.getInitialState(props),
        (base) => ({
            notifyChange: (checked, e) => base.getProps().onChange?.(checked, e),
        })
    );

    const checked = SwitchFoundation.deriveChecked(props, state);

    const wrapperCls = clsx(className, {
        [cssClasses.PREFIX]: true,
        [cssClasses.CHECKED]: checked,
        [cssClasses.DISABLED]: disabled,
        [cssClasses.LARGE]: size === 'large',
        [cssClasses.SMALL]: size === 'small',
        [cssClasses.LOADING]: loading,
    });

    const showCheckedText = checkedText && checked && size !== 'small';
    const showUncheckedText = uncheckedText && !checked && size !== 'small';

    // the root has no role, so aria-* only reaches assistive technology on the input that carries role="switch"
    const isAria = (_: unknown, key: string) => isAriaKey(key);

    const controlAria = pickBy(others, isAria);
    const rest = omitBy(others, isAria);

    return (
        <div {...rest} ref={ref} className={wrapperCls} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {loading ? <Spin wrapperClassName={cssClasses.LOADING_SPIN} size={size === 'default' ? 'middle' : size} /> : <div className={cssClasses.KNOB} aria-hidden />}
            {showCheckedText && (
                <div className={cssClasses.CHECKED_TEXT} x-semi-prop="checkedText">
                    {checkedText}
                </div>
            )}
            {showUncheckedText && (
                <div className={cssClasses.UNCHECKED_TEXT} x-semi-prop="uncheckedText">
                    {uncheckedText}
                </div>
            )}
            <input
                id={id}
                name={name}
                type="checkbox"
                className={cssClasses.NATIVE_CONTROL}
                {...controlAria}
                // a disabled input drops focus, so loading is conveyed by aria only
                aria-disabled={loading || undefined}
                autoFocus={autoFocus}
                role="switch"
                tabIndex={tabIndex}
                checked={checked}
                disabled={disabled}
                onChange={(e) => foundation.handleChange(e.target.checked, e)}
            />
        </div>
    );
}
