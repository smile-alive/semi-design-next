import type React from 'react';
import type { ElementProps } from '../_base/base';
import BasicStep from './basic-step';
import { useStepsContext } from './context';
import FillStep from './fill-step';
import NavStep from './nav-step';
import type { Status } from './types';

export interface StepProps extends ElementProps<'div', 'title' | 'onChange' | 'children'> {
    description?: React.ReactNode;
    icon?: React.ReactNode;
    status?: Status;
    title?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    /** Attached to the step item div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function Step(props: StepProps) {
    const { type } = useStepsContext('Steps.Step');

    switch (type) {
        case 'fill':
            return <FillStep {...props} />;
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
