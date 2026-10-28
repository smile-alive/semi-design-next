import { useState, useRef, useCallback } from 'react';
import { Cropper, Button, Slider, type CropperHandle } from '@fibrae/semi-ui-react';

const containerStyle = {
    width: 550,
    height: 300,
    margin: 20,
};

const actionStyle = {
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
};

export default function CropperDemo() {
    const [rotate, setRotate] = useState(0);
    const [zoom, setZoom] = useState(1);
    const ref = useRef<CropperHandle>(null);
    const [cropperUrl, setCropperUrl] = useState('');

    const onZoomChange = useCallback((value?: number | number[]) => {
        if (typeof value === 'number') setZoom(value);
    }, []);

    const onSliderChange = useCallback((value?: number | number[]) => {
        if (typeof value === 'number') setRotate(value);
    }, []);

    const onButtonClick = useCallback(() => {
        const canvas = ref.current?.getCropperCanvas();
        if (canvas) setCropperUrl(canvas.toDataURL());
    }, []);

    return (
        <div id="cropper-container">
            <Cropper ref={ref} src="/assets/other/image.png" style={containerStyle} rotate={rotate} zoom={zoom} onZoomChange={onZoomChange} />
            <div style={actionStyle}>
                <span id="cropper-rotate-zoom-rotate">旋转</span>
                <Slider aria-labelledby="cropper-rotate-zoom-rotate" style={{ width: 500 }} value={rotate} step={1} min={-360} max={360} onChange={onSliderChange} />
            </div>
            <div style={actionStyle}>
                <span id="cropper-rotate-zoom-zoom">缩放</span>
                <Slider aria-labelledby="cropper-rotate-zoom-zoom" style={{ width: 500 }} value={zoom} step={0.1} min={0.1} max={3} onChange={onZoomChange} />
            </div>
            <br />
            <Button onClick={onButtonClick}>裁切</Button>
            <br />
            <br />
            {cropperUrl && <img src={cropperUrl} alt="裁切结果" style={{ height: 400 }} />}
        </div>
    );
}
