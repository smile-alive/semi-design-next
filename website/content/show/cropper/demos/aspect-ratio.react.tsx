import { useState, useRef, useCallback } from 'react';
import { Cropper, Button, type CropperHandle } from '@fibrae/semi-ui-react';

const containerStyle = {
    width: 550,
    height: 300,
    margin: 20,
};

export default function CropperDemo() {
    const ref = useRef<CropperHandle>(null);
    const [cropperUrl, setCropperUrl] = useState('');

    const onButtonClick = useCallback(() => {
        const canvas = ref.current?.getCropperCanvas();
        if (canvas) setCropperUrl(canvas.toDataURL());
    }, []);

    return (
        <>
            <Cropper aspectRatio={3 / 4} ref={ref} src="/assets/other/image.png" style={containerStyle} />
            <Button onClick={onButtonClick}>裁切</Button>
            <br />
            <br />
            {cropperUrl && <img src={cropperUrl} alt="裁切结果" style={{ height: 400 }} />}
        </>
    );
}
