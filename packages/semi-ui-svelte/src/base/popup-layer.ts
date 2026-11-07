import { createContext } from './create-context.js';

// Context that styles a group of siblings (ButtonGroup) reaches popups too, since they stay in the component tree;
// consumers compare layers so it stops at popups opened from inside the group, as React's direct-children cloning did.
export const [getPopupLayerContext, setPopupLayerContext] = createContext<symbol>('PopupLayer', { optional: true });
