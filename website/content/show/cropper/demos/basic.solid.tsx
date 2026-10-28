import { Show, createSignal } from 'solid-js';
import { Button, Cropper, Radio, RadioGroup, type CropperElement, type CropperProps, type RadioChangeEvent } from '@fibrae/semi-ui-solid';

const containerStyle = {
    width: '550px',
    height: '300px',
    margin: '20px',
};

export default function CropperDemo() {
    let cropper: CropperElement | undefined;
    const [shape, setShape] = createSignal<CropperProps['shape']>('rect');
    const [cropperUrl, setCropperUrl] = createSignal('');

    const onButtonClick = () => {
        const canvas = cropper?.getCropperCanvas();
        if (canvas) setCropperUrl(canvas.toDataURL());
    };

    const onShapeChange = (event: RadioChangeEvent) => {
        setShape(event.target.value);
    };

    return (
        <>
            <RadioGroup aria-label="裁切框形状" onChange={onShapeChange} value={shape()}>
                <Radio value="rect">rect</Radio>
                <Radio value="round">round</Radio>
                <Radio value="roundRect">roundRect</Radio>
            </RadioGroup>
            <Cropper ref={(node) => (cropper = node)} src="/assets/other/image.png" style={containerStyle} shape={shape()} />
            <Button onClick={onButtonClick}>裁切</Button>
            <br />
            <br />
            <Show when={cropperUrl()}>
                <img src={cropperUrl()} alt="裁切结果" style={{ height: '400px' }} />
            </Show>
        </>
    );
}
