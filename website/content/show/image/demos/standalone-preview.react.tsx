import { useMemo, useCallback, useState } from 'react';
import { ImagePreview, Button } from '@fibrae/semi-ui-react';

export default function ImageDemo() {
    const srcList = useMemo(() => ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'], []);

    const [visible1, setVisible1] = useState(false);
    const [visible2, setVisible2] = useState(false);

    const visibleChange1 = useCallback((v: boolean) => {
        setVisible1(v);
    }, []);

    const visibleChange2 = useCallback((v: boolean) => {
        setVisible2(v);
    }, []);

    const onButton1Click = useCallback(() => {
        setVisible1(true);
    }, []);

    const onButton2Click = useCallback(() => {
        setVisible2(true);
    }, []);

    return (
        <>
            <Button onClick={onButton1Click}>Preview single Image</Button>
            <ImagePreview src="/assets/root-web-sites/sky.jpg" visible={visible1} onVisibleChange={visibleChange1} />
            <br />
            <Button onClick={onButton2Click} style={{ marginTop: 20 }}>
                Preview multiple Images
            </Button>
            <ImagePreview src={srcList} previewTitle="Scenery" visible={visible2} onVisibleChange={visibleChange2} />
        </>
    );
}
