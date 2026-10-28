import type React from 'react';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/steps/constants';
import { IconTickCircle, IconAlertCircle, IconAlertTriangle } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import type { Size, Status } from './types';
import { useStepItem } from './use-step-item';

export interface BasicStepProps extends ElementProps<'div', 'title' | 'onChange' | 'children'> {
    description?: React.ReactNode;
    icon?: React.ReactNode;
    status?: Status;
    title?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    active?: boolean;
    prefixCls?: string;
    stepNumber?: string;
    size?: Size;
    done?: boolean;
    onChange?: () => void;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    role?: React.AriaRole;
    'aria-label'?: React.AriaAttributes['aria-label'];
    /** Attached to the step item div */
    ref?: React.Ref<HTMLDivElement>;
}

export const stepSizeMapIconSize = {
    small: 'large',
    default: 'extra-large',
} as const;

export default function BasicStep(props: BasicStepProps) {
    const { ref, role, prefixCls = css.ITEM, className = '', size, title, description, status = 'wait', style, active = false, done = false, icon, stepNumber, onClick, onChange, onKeyDown, ...rest } = props;

    const item = useStepItem({ role, onChange, onClick, onKeyDown }, rest);

    const classString = clsx(
        prefixCls,
        `${prefixCls}-${status}`,
        {
            [`${prefixCls}-active`]: active,
            [`${prefixCls}-done`]: done,
            [`${prefixCls}-hover`]: onChange || props.onClick,
            [`${prefixCls}-clickable`]: onChange || onClick,
            [`${prefixCls}-${status}-hover`]: onChange || props.onClick,
        },
        className
    );

    const titleTextClass = clsx(`${prefixCls}-title-text`, {
        [`${prefixCls}-title-text-empty`]: !title,
    });

    const renderIcon = () => {
        let inner, progress;

        if (icon !== undefined) {
            inner = icon;
        } else {
            switch (status) {
                case 'error':
                    inner = <IconAlertCircle size={stepSizeMapIconSize[size]} />;
                    break;
                case 'wait':
                    inner = <span className={`${prefixCls}-number-icon`}>{stepNumber}</span>;
                    break;
                case 'process':
                    inner = <span className={`${prefixCls}-number-icon`}>{stepNumber}</span>;
                    progress = true;
                    break;
                case 'finish':
                    inner = <IconTickCircle size={stepSizeMapIconSize[size]} />;
                    break;
                case 'warning':
                    inner = <IconAlertTriangle size={stepSizeMapIconSize[size]} />;
                    break;
                default:
                    inner = null;
                    break;
            }
        }
        const cls = clsx({
            [`${prefixCls}-icon`]: true,
            [`${prefixCls}-custom-icon`]: icon !== undefined,
            [`${prefixCls}-icon-process`]: progress,
        });

        return inner ? <span className={cls}>{inner}</span> : null;
    };

    return (
        <div {...rest} ref={ref} className={classString} style={style} aria-current={active ? 'step' : undefined} role={item.role} tabIndex={item.tabIndex} onClick={item.onClick} onKeyDown={item.onKeyDown}>
            <div className={`${prefixCls}-container`}>
                <div className={`${prefixCls}-left`}>{renderIcon()}</div>
                <div className={`${prefixCls}-content`}>
                    <div className={`${prefixCls}-title`}>
                        <div className={titleTextClass}>{title}</div>
                    </div>
                    {description && <div className={`${prefixCls}-description`}>{description}</div>}
                </div>
            </div>
        </div>
    );
}
