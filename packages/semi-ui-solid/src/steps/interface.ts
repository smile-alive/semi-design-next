import type { JSX } from 'solid-js';
import type { StepStatus } from '@fibrae/semi-foundation/steps/utils';
import type { ElementProps } from '../_base/element-props';

export type Status = StepStatus;
export type Size = 'default' | 'small';
export type Direction = 'horizontal' | 'vertical';

export interface StepProps extends ElementProps<'div', 'title' | 'onChange' | 'children'> {
    description?: JSX.Element;
    icon?: JSX.Element;
    status?: Status;
    title?: JSX.Element;
}

/** What Steps hands a step item besides the step's own props */
export interface BasicStepProps extends StepProps {
    active?: boolean;
    prefixCls?: string;
    stepNumber?: string;
    size?: Size;
    done?: boolean;
    onChange?: () => void;
}

export interface FillStepProps extends StepProps {
    prefixCls?: string;
    stepNumber?: string;
    active?: boolean;
    onChange?: () => void;
}

export interface NavStepProps extends StepProps {
    index?: number;
    active?: boolean;
    total?: number;
    prefixCls?: string;
    onChange?: () => void;
}

export interface BasicStepsProps extends ElementProps<'div', 'onChange'> {
    prefixCls?: string;
    direction?: Direction;
    current?: number;
    initial?: number;
    status?: Status;
    size?: Size;
    hasLine?: boolean;
    onChange?: (current: number) => void;
}

export interface FillStepsProps extends ElementProps<'div', 'onChange'> {
    prefixCls?: string;
    current?: number;
    direction?: Direction;
    initial?: number;
    status?: Status;
    onChange?: (current: number) => void;
}

export interface NavStepsProps extends ElementProps<'div', 'onChange'> {
    prefixCls?: string;
    current?: number;
    initial?: number;
    size?: Size;
    onChange?: (current: number) => void;
}

export interface FillStepsAllProps extends FillStepsProps {
    type?: 'fill';
}
export interface BasicStepsAllProps extends BasicStepsProps {
    type?: 'basic';
}
export interface NavStepsAllProps extends NavStepsProps {
    type?: 'nav';
}
export type StepsProps = FillStepsAllProps | BasicStepsAllProps | NavStepsAllProps;
