import { useState } from 'react';
import { ImagePreview, Button } from '@fibrae/semi-ui-react';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];

export default function ImageDemo() {
    const [visible1, setVisible1] = useState(false);
    const [visible2, setVisible2] = useState(false);

    return (
        <>
            <Button onClick={() => setVisible1(true)}>Preview single Image</Button>
            <ImagePreview src="/assets/root-web-sites/sky.jpg" visible={visible1} onVisibleChange={(visible) => setVisible1(visible)} />
            <br />
            <Button onClick={() => setVisible2(true)} style={{ marginBlockStart: 20 }}>
                Preview multiple Images
            </Button>
            <ImagePreview src={srcList} previewTitle="Scenery" visible={visible2} onVisibleChange={(visible) => setVisible2(visible)} />
        </>
    );
}
