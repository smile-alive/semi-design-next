import { createContext } from './create-context';

// Solid context passes through Portal, so context that styles a group of siblings (ButtonGroup) also reaches popups
// opened from inside the group; consumers compare layers so it stops at those popups. Each popup opens its own layer.
export const [PopupLayerContext, usePopupLayer] = createContext<symbol>('PopupLayer', { optional: true });
