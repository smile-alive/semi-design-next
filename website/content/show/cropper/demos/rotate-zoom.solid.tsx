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
        <div id="cropper-container">
            <Cropper ref={(node) => (cropper = node)} src="/assets/other/image.png" style={containerStyle} rotate={rotate()} zoom={zoom()} onZoomChange={(value) => setZoom(value)} />
            <div style={actionStyle}>
                <span id="cropper-rotate-zoom-rotate">旋转</span>
                <Slider aria-labelledby="cropper-rotate-zoom-rotate" style={{ width: '500px' }} value={rotate()} step={1} min={-360} max={360} onChange={onSliderChange} />
            </div>
            <div style={actionStyle}>
                <span id="cropper-rotate-zoom-zoom">缩放</span>
                <Slider aria-labelledby="cropper-rotate-zoom-zoom" style={{ width: '500px' }} value={zoom()} step={0.1} min={0.1} max={3} onChange={onZoomSliderChange} />
            </div>
            <br />
            <Button onClick={onButtonClick}>裁切</Button>
            <br />
            <br />
            <Show when={cropperUrl()}>
                <img src={cropperUrl()} alt="裁切结果" style={{ height: '400px' }} />
            </Show>
        </div>
    );
}
