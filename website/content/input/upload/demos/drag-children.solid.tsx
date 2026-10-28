import { IconBolt } from '@fibrae/semi-icons-solid';
import { Upload } from '@fibrae/semi-ui-solid';

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" dragIcon={<IconBolt />} draggable accept="application/pdf,.jpeg" style={{ 'margin-top': '10px' }}>
            <div class="components-upload-demo-drag-area">
                <img src="/assets/placeholder/avatar-a.svg" height="96" alt="demo img" style={{ 'border-radius': '4px' }} />
                <div
                    style={{
                        'font-size': '14px',
                        'margin-top': '8px',
                        'flex-basis': '100%',
                        'text-align': 'center',
                        color: 'var(--semi-color-tertiary)',
                    }}
                >
                    Wow, you can really dance.
                </div>
            </div>
        </Upload>
    );
}
