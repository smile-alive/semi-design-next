import type React from 'react';
import type { StepPart } from '@fibrae/semi-foundation/components/steps/constants';
import type { ElementProps } from '../../base/index';
import BasicStep from './basic-step';
import { useStepsContext } from './context';
import NavStep from './nav-step';
import type { Status } from './types';

export interface StepProps extends ElementProps<'div', 'title' | 'onChange' | 'children'> {
    description?: React.ReactNode;
    icon?: React.ReactNode;
    status?: Status;
    title?: React.ReactNode;
    className?: string;
    classNames?: Partial<Record<StepPart, string>>;
    style?: React.CSSProperties;
    styles?: Partial<Record<StepPart, React.CSSProperties>>;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    /** Attached to the step item div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function Step(props: StepProps) {
    const { type } = useStepsContext('Steps.Step');

    switch (type) {
        case 'basic':
            return <BasicStep {...props} />;
        case 'nav': {
            // nav steps show only the title; these would otherwise land on the item div as unknown attributes
            const { description, icon, status, ...navProps } = props;
            return <NavStep {...navProps} />;
        }
        default:
            return null;
    }
}
