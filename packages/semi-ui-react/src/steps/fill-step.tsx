import type React from 'react';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/steps/constants';
import { IconTickCircle, IconAlertCircle, IconAlertTriangle } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import type { Status } from './types';
import { useStepItem } from './use-step-item';

export interface FillStepProps extends ElementProps<'div', 'title' | 'onChange' | 'children'> {
    description?: React.ReactNode;
    icon?: React.ReactNode;
    status?: Status;
    title?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    prefixCls?: string;
    stepNumber?: string;
    active?: boolean;
    onChange?: () => void;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    role?: React.AriaRole;
    'aria-label'?: React.AriaAttributes['aria-label'];
    /** Attached to the step item div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function FillStep({ ref, role, prefixCls = css.ITEM, className = '', title, description, status = 'wait', active = false, style, onClick, icon, onChange, stepNumber, onKeyDown, ...rest }: FillStepProps) {
    const item = useStepItem({ role, onChange, onClick, onKeyDown }, rest);

    const renderIcon = () => {
        let inner, progress;

        if (icon !== undefined) {
            inner = icon;
        } else if (status !== undefined) {
            switch (status) {
                case 'error':
                    inner = <IconAlertCircle size="extra-large" />;
                    break;
                case 'wait':
                    inner = stepNumber;
                    break;
                case 'process':
                    inner = stepNumber;
                    progress = true;
                    break;
                case 'finish':
                    inner = <IconTickCircle size="extra-large" />;
                    break;
                case 'warning':
                    inner = <IconAlertTriangle size="extra-large" />;
                    break;
                default:
                    inner = null;
                    break;
            }
        }
        const cls = clsx({
            [`${prefixCls}-left`]: true,
            [`${prefixCls}-icon`]: icon !== undefined,
            [`${prefixCls}-plain`]: icon === undefined,
            [`${prefixCls}-icon-process`]: progress,
            [`${prefixCls}-hover`]: onChange || onClick,
        });

        return inner ? <div className={cls}>{inner}</div> : null;
    };

    return (
        <div
            {...rest}
            ref={ref}
            className={clsx(
                {
                    [prefixCls]: true,
                    [`${prefixCls}-${status}`]: Boolean(status),
                    [`${prefixCls}-${status}-hover`]: Boolean(status) && (onChange || onClick),
                    [`${prefixCls}-${status}-active`]: Boolean(status) && (onChange || onClick),
                    [`${prefixCls}-clickable`]: onChange || onClick,
                },
                className
            )}
            style={style}
            aria-current={active ? 'step' : undefined}
            role={item.role}
            tabIndex={item.tabIndex}
            onClick={item.onClick}
            onKeyDown={item.onKeyDown}
        >
            {renderIcon()}
            <div className={`${prefixCls}-content`}>
                <div className={`${prefixCls}-title`} title={typeof title === 'string' ? title : null}>
                    <span className={`${prefixCls}-title-text`}>{title}</span>
                </div>
                <div className={`${prefixCls}-description`} title={typeof description === 'string' ? description : null}>
                    {description}
                </div>
            </div>
        </div>
    );
}
