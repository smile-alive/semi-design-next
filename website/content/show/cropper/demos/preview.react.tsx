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
    const [cropperUrl, setCropperUrl] = useState('');
    const ref = useRef<CropperHandle>(null);

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

    const preview = useCallback(() => {
        const previewContainer = document.getElementById('previewWrapper') as HTMLElement;
        return previewContainer;
    }, []);

    return (
        <div>
            <Cropper ref={ref} src="/assets/root-web-sites/abstract.jpg" style={containerStyle} rotate={rotate} zoom={zoom} onZoomChange={onZoomChange} preview={preview} />
            <div style={actionStyle}>
                <span id="cropper-preview-rotate">旋转</span>
                <Slider aria-labelledby="cropper-preview-rotate" style={{ width: 500 }} value={rotate} step={1} min={-360} max={360} onChange={onSliderChange} />
            </div>
            <div style={actionStyle}>
                <span id="cropper-preview-zoom">缩放</span>
                <Slider aria-labelledby="cropper-preview-zoom" style={{ width: 500 }} value={zoom} step={0.1} min={0.1} max={3} onChange={onZoomChange} />
            </div>
            <br />
            <div style={{ display: 'flex' }}>
                <div style={{ width: '50%', flexGrow: 1 }}>
                    <strong>实时预览</strong>
                    <div id="previewWrapper" style={{ height: 300, marginTop: 8 }} />
                </div>
                <div style={{ width: '50%', flexGrow: 1, paddingLeft: 10 }}>
                    <Button onClick={onButtonClick}>裁切</Button>
                    <br />
                    <br />
                    {cropperUrl && <img src={cropperUrl} alt="裁切结果" style={{ width: '90%' }} />}
                </div>
            </div>
        </div>
    );
}
