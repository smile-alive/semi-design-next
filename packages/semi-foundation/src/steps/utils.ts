export type StepStatus = 'wait' | 'process' | 'finish' | 'error' | 'warning';

export interface StepState {
    /** Undefined when the step has its own status */
    status?: StepStatus;
    active: boolean;
    done: boolean;
    /** The step before the current one while the flow is in error */
    nextError: boolean;
}

export function getStepState(stepNumber: number, current: number, status: StepStatus, hasOwnStatus: boolean): StepState {
    let derived: StepStatus | undefined;
    if (!hasOwnStatus) {
        if (stepNumber === current) {
            derived = status;
        } else {
            derived = stepNumber < current ? 'finish' : 'wait';
        }
    }
    return {
        status: derived,
        active: stepNumber === current,
        done: stepNumber < current,
        nextError: status === 'error' && stepNumber === current - 1,
    };
}
