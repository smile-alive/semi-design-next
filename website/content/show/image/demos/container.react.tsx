import { Image, ImagePreview } from '@fibrae/semi-ui-react';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];

export default function ImageDemo() {
    return (
        <div
            id="container"
            style={{
                height: 400,
                position: 'relative',
            }}
        >
            <ImagePreview
                getPopupContainer={() => {
                    const node = document.getElementById('container') as HTMLElement;
                    return node;
                }}
                style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {srcList.map((src, index) => {
                    return <Image key={index} src={src} width={200} alt={`lamp${index + 1}`} style={{ marginInlineEnd: 5 }} />;
                })}
            </ImagePreview>
        </div>
    );
}
