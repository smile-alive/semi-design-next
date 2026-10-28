import { IconBolt } from '@fibrae/semi-icons-react';
import { Upload } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" dragIcon={<IconBolt />} draggable accept="application/pdf,.jpeg" style={{ marginTop: 10 }}>
            <div className="components-upload-demo-drag-area">
                <img src="/assets/placeholder/avatar-a.svg" height="96" alt="demo img" style={{ borderRadius: 4 }} />
                <div
                    style={{
                        fontSize: 14,
                        marginTop: 8,
                        flexBasis: '100%',
                        textAlign: 'center',
                        color: 'var(--semi-color-tertiary)',
                    }}
                >
                    Wow, you can really dance.
                </div>
            </div>
        </Upload>
    );
}
