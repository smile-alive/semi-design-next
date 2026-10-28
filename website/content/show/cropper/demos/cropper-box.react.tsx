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
            <strong>showResizeBox = false，并修改边框颜色</strong>
            <Cropper ref={ref} src="/assets/other/image.png" style={containerStyle} cropperBoxStyle={{ outlineColor: 'var(--semi-color-bg-0)' }} showResizeBox={false} />
            <Button onClick={onButtonClick}>裁切</Button>
            <br />
            <br />
            {cropperUrl && <img src={cropperUrl} alt="裁切结果" style={{ height: 400 }} />}
        </>
    );
}
