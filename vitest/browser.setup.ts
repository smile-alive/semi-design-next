import { beforeEach } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';

// The pointer stays where the previous test left it and Chromium sends mouseenter to whatever renders under it
// (pausing autoplay, opening hover popups); park it bottom-right. Found by test id since positions shift with portals.
beforeEach(async () => {
    const corner = document.createElement('div');
    corner.dataset.testid = 'pointer-park';
    corner.style.cssText = 'position:fixed;right:0;bottom:0;width:4px;height:4px';
    document.body.appendChild(corner);
    await page.getByTestId('pointer-park').hover();
    corner.remove();
});
