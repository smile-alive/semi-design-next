import { createContext } from './create-context';

// React context passes through portals, so context that styles a group of siblings (ButtonGroup, AvatarGroup) also
// reaches popups opened from inside the group; consumers compare layers so it stops at those popups. Tooltip and
// Portal (Modal, SideSheet, ImagePreview) each open a layer per popup.
export const [PopupLayerContext, usePopupLayer] = createContext<symbol>('PopupLayer', { optional: true });
