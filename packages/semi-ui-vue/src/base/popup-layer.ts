import { createContext } from './create-context';

// Context that styles a group of siblings (ButtonGroup) is provided through Teleport as well; consumers compare
// layers so it stops at popups opened from inside the group, as React's direct-children cloning did.
export const [providePopupLayer, usePopupLayer] = createContext<symbol>('PopupLayer', { optional: true });
