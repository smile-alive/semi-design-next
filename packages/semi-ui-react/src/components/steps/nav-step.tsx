import type React from 'react';
import clsx from 'clsx';
import { stepsClasses as css, type StepPart } from '@fibrae/semi-foundation/components/steps/constants';
import { IconChevronRight } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../../base/index';
import { useStepsContext } from './context';
import { useStepItem } from './use-step-item';

export interface NavStepProps extends ElementProps<'div', 'title' | 'onChange' | 'children'> {
    title?: React.ReactNode;
    className?: string;
    classNames?: Partial<Record<StepPart, string>>;
    style?: React.CSSProperties;
    styles?: Partial<Record<StepPart, React.CSSProperties>>;
    index?: number;
    active?: boolean;
    total?: number;
    onChange?: () => void;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    role?: React.AriaRole;
    'aria-label'?: React.AriaAttributes['aria-label'];
    /** Attached to the step item div */
    ref?: React.Ref<HTMLDivElement>;
}

const prefixCls = css.ITEM;

export default function NavStep({ ref, role, className = '', classNames, title, style, styles, active = false, index, total, onClick, onKeyDown, onChange, ...rest }: NavStepProps) {
    const { classNames: stepsClassNames, styles: stepsStyles } = useStepsContext('Steps.Step');

    const item = useStepItem({ role, onChange, onClick, onKeyDown }, rest);

    const classString = clsx(
        prefixCls,
        {
            [`${prefixCls}-active`]: active,
        },
        stepsClassNames?.item,
        className
    );

    return (
        <div {...rest} ref={ref} className={classString} style={{ ...stepsStyles?.item, ...style }} aria-current={active ? 'step' : undefined} role={item.role} tabIndex={item.tabIndex} onClick={item.onClick} onKeyDown={item.onKeyDown}>
            <div className={`${prefixCls}-container`}>
                <div className={clsx(`${prefixCls}-content`, stepsClassNames?.itemContent, classNames?.content)} style={{ ...stepsStyles?.itemContent, ...styles?.content }}>
                    <div className={clsx(`${prefixCls}-title`, stepsClassNames?.itemTitle, classNames?.title)} style={{ ...stepsStyles?.itemTitle, ...styles?.title }}>
                        {title}
                    </div>
                </div>
                {index !== total - 1 && (
                    <div className={clsx(`${prefixCls}-icon`, stepsClassNames?.itemIcon, classNames?.icon)} style={{ ...stepsStyles?.itemIcon, ...styles?.icon }}>
                        <IconChevronRight size="small" />
                    </div>
                )}
            </div>
        </div>
    );
}
