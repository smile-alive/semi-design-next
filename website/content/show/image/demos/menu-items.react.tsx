import { useCallback } from 'react';
import { IconInfoCircle } from '@fibrae/semi-icons-react';
import { Image, ImagePreview, Divider, Tooltip, type ImagePreviewMenuProps } from '@fibrae/semi-ui-react';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];

export default function ImageDemo() {
    const renderPreviewMenu = useCallback((menu: ImagePreviewMenuProps) => {
        const menuItems = menu.menuItems ?? [];
        const customNode = (
            <Tooltip content="我是一个自定义操作">
                <IconInfoCircle size="large" />
            </Tooltip>
        );
        return (
            <div
                style={{
                    display: 'flex',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    alignItems: 'center',
                    padding: '5px 16px',
                    borderRadius: 4,
                }}
            >
                {menuItems.slice(0, 3)}
                <Divider layout="vertical" />
                {menuItems.slice(3, 7)}
                <Divider layout="vertical" />
                {menuItems.slice(7)}
                <Divider layout="vertical" />
                {customNode}
            </div>
        );
    }, []);

    return (
        <ImagePreview renderPreviewMenu={renderPreviewMenu}>
            {srcList.map((src, index) => (
                <Image key={index} src={src} width={200} alt={`lamp${index + 1}`} />
            ))}
        </ImagePreview>
    );
}
