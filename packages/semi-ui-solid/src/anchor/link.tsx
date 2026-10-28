import { createToken } from '../_base/token';
import type { LinkProps } from './interface';

export const LINK = 'Anchor.Link';

// Anchor renders the link from this token and nests the links in its children itself. No context is read here: the
// token is created in Anchor's children() memo, outside AnchorContext.Provider.
export default function Link(props: LinkProps) {
    return createToken(LINK, props);
}
