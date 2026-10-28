import { Show, createSignal } from 'solid-js';
import { Button, Cropper, type CropperElement } from '@fibrae/semi-ui-solid';

const containerStyle = {
    width: '550px',
    height: '300px',
    margin: '20px',
};

export default function CropperDemo() {
    let cropper: CropperElement | undefined;
    const [cropperUrl, setCropperUrl] = createSignal('');

    const onButtonClick = () => {
        const canvas = cropper?.getCropperCanvas();
        if (canvas) setCropperUrl(canvas.toDataURL());
    };

    return (
        <>
            <Cropper aspectRatio={3 / 4} ref={(node) => (cropper = node)} src="/assets/other/image.png" style={containerStyle} />
            <Button onClick={onButtonClick}>裁切</Button>
            <br />
            <br />
            <Show when={cropperUrl()}>
                <img src={cropperUrl()} alt="裁切结果" style={{ height: '400px' }} />
            </Show>
        </>
    );
}
