import type { CSSProperties } from 'react';
import type { StepsPart } from '@fibrae/semi-foundation/components/steps/constants';
import '@fibrae/semi-foundation/components/steps/steps.scss';
import { useDefaultProps } from '../../base/index';
import BasicSteps, { type BasicStepsProps } from './basic-steps';
import { StepsContext } from './context';
import NavSteps, { type NavStepsProps } from './nav-steps';

export type { Status, Size, Direction } from './types';
export type { BasicStepProps } from './basic-step';
export type { BasicStepsProps } from './basic-steps';
export type { NavStepProps } from './nav-step';
export type { NavStepsProps } from './nav-steps';
export type { StepProps } from './step';

interface StepsPartProps {
    classNames?: Partial<Record<StepsPart, string>>;
    styles?: Partial<Record<StepsPart, CSSProperties>>;
}

export interface BasicStepsAllProps extends BasicStepsProps, StepsPartProps {
    type?: 'basic';
}
export interface NavStepsAllProps extends NavStepsProps, StepsPartProps {
    type?: 'nav';
}
export type StepsProps = BasicStepsAllProps | NavStepsAllProps;

const defaultProps = { type: 'basic' as const, size: 'default' as const };

function Steps(rawProps: StepsProps) {
    const { type, ...props } = useDefaultProps('Steps', rawProps, defaultProps);

    // strip type-specific keys so each implementation's root spread never puts them on the DOM
    const { size, hasLine, direction, status, classNames, styles, ...rest } = props as BasicStepsProps & StepsPartProps;

    let steps = null;

    switch (type) {
        case 'basic':
            steps = <BasicSteps {...rest} direction={direction} hasLine={hasLine} size={size} status={status} />;
            break;
        case 'nav':
            steps = <NavSteps {...rest} size={size} />;
            break;
    }

    return <StepsContext value={{ type, classNames, styles }}>{steps}</StepsContext>;
}

export default Steps;
