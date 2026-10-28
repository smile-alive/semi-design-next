import type React from 'react';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/steps/constants';
import { IconChevronRight } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import { useStepItem } from './use-step-item';

export interface NavStepProps extends ElementProps<'div', 'title' | 'onChange' | 'children'> {
    title?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    index?: number;
    active?: boolean;
    total?: number;
    prefixCls?: string;
    onChange?: () => void;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    role?: React.AriaRole;
    'aria-label'?: React.AriaAttributes['aria-label'];
    /** Attached to the step item div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function NavStep({ ref, role, prefixCls = css.ITEM, className = '', title, style, active = false, index, total, onClick, onKeyDown, onChange, ...rest }: NavStepProps) {
    const item = useStepItem({ role, onChange, onClick, onKeyDown }, rest);

    const classString = clsx(
        prefixCls,
        {
            [`${prefixCls}-active`]: active,
        },
        className
    );

    return (
        <div {...rest} ref={ref} className={classString} style={style} aria-current={active ? 'step' : undefined} role={item.role} tabIndex={item.tabIndex} onClick={item.onClick} onKeyDown={item.onKeyDown}>
            <div className={`${prefixCls}-container`}>
                <div className={`${prefixCls}-content`}>
                    <div className={`${prefixCls}-title`}>{title}</div>
                </div>
                {index !== total - 1 && (
                    <div className={`${prefixCls}-icon`}>
                        <IconChevronRight size="small" />
                    </div>
                )}
            </div>
        </div>
    );
}
