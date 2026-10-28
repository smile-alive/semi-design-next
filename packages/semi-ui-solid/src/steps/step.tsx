import { createToken } from '../_base/token';
import type { StepProps } from './interface';

export const STEP = 'Steps.Step';

// Steps renders the step item from this token, so the item type follows Steps' type. No context is read here: the
// token is created in Steps' children() memo, outside Steps' own tree.
export default function Step(props: StepProps) {
    return createToken(STEP, props);
}
