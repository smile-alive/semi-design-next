import type { JSX } from 'solid-js';
import type { StepPart, StepsPart } from '@fibrae/semi-foundation/components/steps/constants';
import type { StepStatus } from '@fibrae/semi-foundation/components/steps/utils';
import type { ElementProps } from '../../base/index';

export type Status = StepStatus;
export type Size = 'default' | 'small';
export type Direction = 'horizontal' | 'vertical';

type Style = JSX.CSSProperties | string;

export interface StepProps extends ElementProps<'div', 'title' | 'onChange' | 'children'> {
    classNames?: Partial<Record<StepPart, string>>;
    description?: JSX.Element;
    icon?: JSX.Element;
    status?: Status;
    styles?: Partial<Record<StepPart, Style>>;
    title?: JSX.Element;
}

/** Set by Steps from its own `classNames` and `styles` */
interface StepsPartProps {
    stepsClassNames?: Partial<Record<StepsPart, string>>;
    stepsStyles?: Partial<Record<StepsPart, Style>>;
}

export interface BasicStepProps extends StepProps, StepsPartProps {
    active?: boolean;
    stepNumber?: string;
    size?: Size;
    done?: boolean;
    onChange?: () => void;
}

export interface NavStepProps extends StepProps, StepsPartProps {
    index?: number;
    active?: boolean;
    total?: number;
    onChange?: () => void;
}

export interface BasicStepsProps extends ElementProps<'div', 'onChange'> {
    direction?: Direction;
    current?: number;
    initial?: number;
    status?: Status;
    size?: Size;
    hasLine?: boolean;
    onChange?: (current: number) => void;
}

export interface NavStepsProps extends ElementProps<'div', 'onChange'> {
    current?: number;
    initial?: number;
    size?: Size;
    onChange?: (current: number) => void;
}

export interface StepsOwnPartProps {
    classNames?: Partial<Record<StepsPart, string>>;
    styles?: Partial<Record<StepsPart, Style>>;
}

export interface BasicStepsAllProps extends BasicStepsProps, StepsOwnPartProps {
    type?: 'basic';
}
export interface NavStepsAllProps extends NavStepsProps, StepsOwnPartProps {
    type?: 'nav';
}
export type StepsProps = BasicStepsAllProps | NavStepsAllProps;
