import { Index } from 'solid-js';
import { IconInfoCircle } from '@fibrae/semi-icons-solid';
import { Divider, Image, ImagePreview, Tooltip, type ImagePreviewMenuProps } from '@fibrae/semi-ui-solid';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];

// the preview calls the renderer once and the menu items stay live, so the JSX reads them directly
function renderPreviewMenu(menu: ImagePreviewMenuProps) {
    return (
        <div style={{ display: 'flex', 'background-color': 'rgba(0, 0, 0, 0.75)', 'align-items': 'center', padding: '5px 16px', 'border-radius': '4px' }}>
            {menu.menuItems?.slice(0, 3)}
            <Divider layout="vertical" />
            {menu.menuItems?.slice(3, 7)}
            <Divider layout="vertical" />
            {menu.menuItems?.slice(7)}
            <Divider layout="vertical" />
            <Tooltip content="我是一个自定义操作">
                <IconInfoCircle size="large" />
            </Tooltip>
        </div>
    );
}

export default function ImageDemo() {
    return (
        <ImagePreview renderPreviewMenu={renderPreviewMenu}>
            <Index each={srcList}>{(src, index) => <Image src={src()} width={200} alt={`lamp${index + 1}`} />}</Index>
        </ImagePreview>
    );
}
