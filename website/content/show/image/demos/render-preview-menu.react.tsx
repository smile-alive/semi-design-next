import { useMemo, useCallback } from 'react';
import { IconChevronLeft, IconChevronRight, IconMinus, IconPlus, IconRotate, IconDownload, IconRealSizeStroked, IconWindowAdaptionStroked } from '@fibrae/semi-icons-react';
import { Image, ImagePreview, Button, type ImagePreviewMenuProps } from '@fibrae/semi-ui-react';

export default function ImageDemo() {
    const srcList = useMemo(() => ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'], []);

    const renderPreviewMenu = useCallback(({ ratio, disabledPrev, disabledNext, disabledZoomIn, disabledZoomOut, disableDownload, onDownload, onNext, onPrev, onRotateLeft, onRatioClick, onZoomIn, onZoomOut }: ImagePreviewMenuProps) => {
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
                <Button aria-label="上一张" icon={<IconChevronLeft size="large" />} type="tertiary" onClick={onPrev} disabled={disabledPrev} />
                <Button aria-label="下一张" icon={<IconChevronRight size="large" />} type="tertiary" onClick={onNext} disabled={disabledNext} />
                <Button aria-label="缩小" icon={<IconMinus size="large" />} type="tertiary" onClick={onZoomOut} disabled={disabledZoomOut} />
                <Button aria-label="放大" icon={<IconPlus size="large" />} type="tertiary" onClick={onZoomIn} disabled={disabledZoomIn} />
                <Button aria-label={ratio === 'adaptation' ? '原始尺寸' : '适应页面'} icon={ratio === 'adaptation' ? <IconRealSizeStroked size="large" /> : <IconWindowAdaptionStroked size="large" />} type="tertiary" onClick={onRatioClick} />
                <Button aria-label="旋转" icon={<IconRotate size="large" />} type="tertiary" onClick={onRotateLeft} />
                <Button aria-label="下载" icon={<IconDownload size="large" />} type="tertiary" onClick={onDownload} disabled={disableDownload} />
            </div>
        );
    }, []);

    return (
        <ImagePreview renderPreviewMenu={renderPreviewMenu}>
            {srcList.map((src, index) => {
                return <Image key={index} src={src} width={200} alt={`lamp${index + 1}`} style={{ marginRight: 5 }} />;
            })}
        </ImagePreview>
    );
}
