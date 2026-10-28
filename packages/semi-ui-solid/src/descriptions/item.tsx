import { createToken } from '../_base/token';
import type { DescriptionsItemProps } from './interface';

export const DESCRIPTIONS_ITEM = 'Descriptions.Item';

// Descriptions renders the row or cells from this token.
export default function Item(props: DescriptionsItemProps) {
    return createToken(DESCRIPTIONS_ITEM, props);
}
