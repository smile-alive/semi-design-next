import '@fibrae/semi-foundation/steps/steps.scss';
import useDefaultProps from '../_base/use-default-props';
import BasicSteps, { type BasicStepsProps } from './basic-steps';
import { StepsContext } from './context';
import FillSteps, { type FillStepsProps } from './fill-steps';
import NavSteps, { type NavStepsProps } from './nav-steps';
import Step from './step';

export type { Status, Size, Direction } from './types';
export type { BasicStepProps } from './basic-step';
export type { BasicStepsProps } from './basic-steps';
export type { FillStepProps } from './fill-step';
export type { FillStepsProps } from './fill-steps';
export type { NavStepProps } from './nav-step';
export type { NavStepsProps } from './nav-steps';
export type { StepProps } from './step';

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

const defaultProps = { type: 'fill' as const, size: 'default' as const };

function Steps(rawProps: StepsProps) {
    const { type, ...props } = useDefaultProps('Steps', rawProps, defaultProps);

    // strip type-specific keys so each implementation's root spread never puts them on the DOM
    const { size, hasLine, direction, status, ...rest } = props as BasicStepsProps;

    let steps = null;

    switch (type) {
        case 'fill':
            steps = <FillSteps {...rest} direction={direction} status={status} />;
            break;
        case 'basic':
            steps = <BasicSteps {...rest} direction={direction} hasLine={hasLine} size={size} status={status} />;
            break;
        case 'nav':
            steps = <NavSteps {...rest} size={size} />;
            break;
    }

    return <StepsContext value={{ type }}>{steps}</StepsContext>;
}

export default Object.assign(Steps, { Step });
