import { Show, createSignal } from 'solid-js';
import { Button, Cropper, Slider, type CropperElement } from '@fibrae/semi-ui-solid';

const containerStyle = {
    width: '550px',
    height: '300px',
    margin: '20px',
};

const actionStyle = {
    'margin-top': '20px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    width: 'fit-content',
};

export default function CropperDemo() {
    let cropper: CropperElement | undefined;
    let previewWrapper: HTMLDivElement | undefined;
    const [rotate, setRotate] = createSignal(0);
    const [zoom, setZoom] = createSignal(1);
    const [cropperUrl, setCropperUrl] = createSignal('');

    const onSliderChange = (value?: number | number[]) => {
        if (typeof value === 'number') setRotate(value);
    };

    const onZoomSliderChange = (value?: number | number[]) => {
        if (typeof value === 'number') setZoom(value);
    };

    const onButtonClick = () => {
        const canvas = cropper?.getCropperCanvas();
        if (canvas) setCropperUrl(canvas.toDataURL());
    };

    return (
        <div>
            <Cropper ref={(node) => (cropper = node)} rotate={rotate()} zoom={zoom()} onZoomChange={(value) => setZoom(value)} preview={() => previewWrapper ?? null} src="/assets/root-web-sites/abstract.jpg" style={containerStyle} />
            <div style={actionStyle}>
                <span id="cropper-preview-rotate">旋转</span>
                <Slider aria-labelledby="cropper-preview-rotate" style={{ width: '500px' }} value={rotate()} step={1} min={-360} max={360} onChange={onSliderChange} />
            </div>
            <div style={actionStyle}>
                <span id="cropper-preview-zoom">缩放</span>
                <Slider aria-labelledby="cropper-preview-zoom" style={{ width: '500px' }} value={zoom()} step={0.1} min={0.1} max={3} onChange={onZoomSliderChange} />
            </div>
            <br />
            <div style={{ display: 'flex' }}>
                <div style={{ width: '50%', 'flex-grow': '1' }}>
                    <strong>实时预览</strong>
                    <div ref={(node) => (previewWrapper = node)} style={{ height: '300px', 'margin-top': '8px' }} />
                </div>
                <div style={{ width: '50%', 'flex-grow': '1', 'padding-left': '10px' }}>
                    <Button onClick={onButtonClick}>裁切</Button>
                    <br />
                    <br />
                    <Show when={cropperUrl()}>
                        <img src={cropperUrl()} alt="裁切结果" style={{ width: '90%' }} />
                    </Show>
                </div>
            </div>
        </div>
    );
}
