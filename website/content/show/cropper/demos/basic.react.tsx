import { useState, useRef, useCallback } from 'react';
import { Cropper, Button, RadioGroup, Radio, type CropperHandle, type CropperProps, type RadioChangeEvent } from '@fibrae/semi-ui-react';

const containerStyle = {
    width: 550,
    height: 300,
    margin: 20,
};

export default function CropperDemo() {
    const ref = useRef<CropperHandle>(null);
    const [shape, setShape] = useState<CropperProps['shape']>('rect');
    const [cropperUrl, setCropperUrl] = useState('');

    const onButtonClick = useCallback(() => {
        const canvas = ref.current?.getCropperCanvas();
        if (canvas) setCropperUrl(canvas.toDataURL());
    }, []);

    const onShapeChange = useCallback((e: RadioChangeEvent) => {
        setShape(e.target.value);
    }, []);

    return (
        <>
            <RadioGroup aria-label="裁切框形状" onChange={onShapeChange} value={shape}>
                <Radio value="rect">rect</Radio>
                <Radio value="round">round</Radio>
                <Radio value="roundRect">roundRect</Radio>
            </RadioGroup>
            <Cropper ref={ref} src="/assets/other/image.png" style={containerStyle} shape={shape} />
            <Button onClick={onButtonClick}>裁切</Button>
            <br />
            <br />
            {cropperUrl && <img src={cropperUrl} alt="裁切结果" style={{ height: 400 }} />}
        </>
    );
}
