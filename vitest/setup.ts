// TZDate copies its getters from Date.prototype on first evaluation, which a mocked Date has none of: load it before
// setupDeterminism freezes Date
import '@fibrae/semi-foundation/utils/date-fns-extra';
import { setupAnimation } from './jsdom/animation';
import { setupDeterminism } from './jsdom/determinism';
import { setupHover } from './jsdom/hover';
import { setupLayout } from './jsdom/layout';
import { setupMedia } from './jsdom/media';
import { setupObservers } from './jsdom/observers';
import { setupPointerCapture } from './jsdom/pointer-capture';
import { setupPopover } from './jsdom/popover';

setupObservers();
setupLayout();
setupAnimation();
setupMedia();
setupPopover();
setupHover();
setupPointerCapture();
setupDeterminism();
