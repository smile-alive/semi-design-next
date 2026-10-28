import { Index } from 'solid-js';
import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconRealSizeStroked, IconRotate, IconWindowAdaptionStroked } from '@fibrae/semi-icons-solid';
import { Button, Image, ImagePreview, type ImagePreviewMenuProps } from '@fibrae/semi-ui-solid';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];

// the preview calls the renderer once and the menu's fields are getters, so each JSX expression reads them live
function renderPreviewMenu(menu: ImagePreviewMenuProps) {
    return (
        <div style={{ background: 'grey', height: '40px', width: '280px', display: 'flex', 'align-items': 'center', 'justify-content': 'space-around', 'border-radius': '3px' }}>
            <Button aria-label="上一张" icon={<IconChevronLeft size="large" />} type="tertiary" onClick={menu.onPrev} disabled={menu.disabledPrev} />
            <Button aria-label="下一张" icon={<IconChevronRight size="large" />} type="tertiary" onClick={menu.onNext} disabled={menu.disabledNext} />
            <Button aria-label="缩小" icon={<IconMinus size="large" />} type="tertiary" onClick={menu.onZoomOut} disabled={menu.disabledZoomOut} />
            <Button aria-label="放大" icon={<IconPlus size="large" />} type="tertiary" onClick={menu.onZoomIn} disabled={menu.disabledZoomIn} />
            <Button aria-label={menu.ratio === 'adaptation' ? '原始尺寸' : '适应页面'} icon={menu.ratio === 'adaptation' ? <IconRealSizeStroked size="large" /> : <IconWindowAdaptionStroked size="large" />} type="tertiary" onClick={menu.onRatioClick} />
            <Button aria-label="旋转" icon={<IconRotate size="large" />} type="tertiary" onClick={menu.onRotateLeft} />
            <Button aria-label="下载" icon={<IconDownload size="large" />} type="tertiary" onClick={menu.onDownload} disabled={menu.disableDownload} />
        </div>
    );
}

export default function ImageDemo() {
    return (
        <ImagePreview renderPreviewMenu={renderPreviewMenu}>
            <Index each={srcList}>{(src, index) => <Image src={src()} width={200} alt={`lamp${index + 1}`} style={{ 'margin-right': '5px' }} />}</Index>
        </ImagePreview>
    );
}
