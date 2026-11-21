import type React from 'react';
import clsx from 'clsx';
import { stepsClasses as css, type StepPart } from '@fibrae/semi-foundation/components/steps/constants';
import { IconTickCircle, IconAlertCircle, IconAlertTriangle } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../../base/index';
import { useStepsContext } from './context';
import type { Size, Status } from './types';
import { useStepItem } from './use-step-item';

export interface BasicStepProps extends ElementProps<'div', 'title' | 'onChange' | 'children'> {
    description?: React.ReactNode;
    icon?: React.ReactNode;
    status?: Status;
    title?: React.ReactNode;
    className?: string;
    classNames?: Partial<Record<StepPart, string>>;
    style?: React.CSSProperties;
    styles?: Partial<Record<StepPart, React.CSSProperties>>;
    active?: boolean;
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

const stepSizeMapIconSize = {
    small: 'large',
    default: 'extra-large',
} as const;

const prefixCls = css.ITEM;

export default function BasicStep(props: BasicStepProps) {
    const { ref, role, className = '', classNames, size, title, description, status = 'wait', style, styles, active = false, done = false, icon, stepNumber, onClick, onChange, onKeyDown, ...rest } = props;

    const { classNames: stepsClassNames, styles: stepsStyles } = useStepsContext('Steps.Step');

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
        stepsClassNames?.item,
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
        const cls = clsx(
            {
                [`${prefixCls}-icon`]: true,
                [`${prefixCls}-custom-icon`]: icon !== undefined,
                [`${prefixCls}-icon-process`]: progress,
            },
            stepsClassNames?.itemIcon,
            classNames?.icon
        );

        return inner ? (
            <span className={cls} style={{ ...stepsStyles?.itemIcon, ...styles?.icon }}>
                {inner}
            </span>
        ) : null;
    };

    return (
        <div {...rest} ref={ref} className={classString} style={{ ...stepsStyles?.item, ...style }} aria-current={active ? 'step' : undefined} role={item.role} tabIndex={item.tabIndex} onClick={item.onClick} onKeyDown={item.onKeyDown}>
            <div className={`${prefixCls}-container`}>
                <div className={`${prefixCls}-left`}>{renderIcon()}</div>
                <div className={clsx(`${prefixCls}-content`, stepsClassNames?.itemContent, classNames?.content)} style={{ ...stepsStyles?.itemContent, ...styles?.content }}>
                    <div className={clsx(`${prefixCls}-title`, stepsClassNames?.itemTitle, classNames?.title)} style={{ ...stepsStyles?.itemTitle, ...styles?.title }}>
                        <div className={titleTextClass}>{title}</div>
                    </div>
                    {description && (
                        <div className={clsx(`${prefixCls}-description`, stepsClassNames?.itemDescription, classNames?.description)} style={{ ...stepsStyles?.itemDescription, ...styles?.description }}>
                            {description}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
