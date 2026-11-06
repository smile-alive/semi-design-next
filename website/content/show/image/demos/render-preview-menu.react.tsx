import { useCallback } from 'react';
import { IconChevronLeft, IconChevronRight, IconMinus, IconPlus, IconRotate, IconDownload, IconRealSizeStroked, IconWindowAdaptionStroked } from '@fibrae/semi-icons-react';
import { Image, ImagePreview, Button, type ImagePreviewMenuProps } from '@fibrae/semi-ui-react';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];

export default function ImageDemo() {
    const renderPreviewMenu = useCallback((menu: ImagePreviewMenuProps) => {
        return (
            <div
                style={{
                    background: 'grey',
                    height: 40,
                    width: 280,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    borderRadius: 3,
                }}
            >
                <Button aria-label="上一张" icon={<IconChevronLeft size="large" />} type="tertiary" onClick={menu.onPrev} disabled={menu.disabledPrev} />
                <Button aria-label="下一张" icon={<IconChevronRight size="large" />} type="tertiary" onClick={menu.onNext} disabled={menu.disabledNext} />
                <Button aria-label="缩小" icon={<IconMinus size="large" />} type="tertiary" onClick={menu.onZoomOut} disabled={menu.disabledZoomOut} />
                <Button aria-label="放大" icon={<IconPlus size="large" />} type="tertiary" onClick={menu.onZoomIn} disabled={menu.disabledZoomIn} />
                <Button aria-label={menu.ratio === 'adaptation' ? '原始尺寸' : '适应页面'} icon={menu.ratio === 'adaptation' ? <IconRealSizeStroked size="large" /> : <IconWindowAdaptionStroked size="large" />} type="tertiary" onClick={menu.onRatioClick} />
                <Button aria-label="旋转" icon={<IconRotate size="large" />} type="tertiary" onClick={menu.onRotateLeft} />
                <Button aria-label="下载" icon={<IconDownload size="large" />} type="tertiary" onClick={menu.onDownload} disabled={menu.disableDownload} />
            </div>
        );
    }, []);

    return (
        <ImagePreview renderPreviewMenu={renderPreviewMenu}>
            {srcList.map((src, index) => {
                return <Image key={index} src={src} width={200} alt={`lamp${index + 1}`} style={{ marginInlineEnd: 5 }} />;
            })}
        </ImagePreview>
    );
}
