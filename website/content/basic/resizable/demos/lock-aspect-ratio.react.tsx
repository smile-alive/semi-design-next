import { Resizable } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    return (
        <div style={{ width: '500px', height: '60%' }}>
            <Resizable
                style={{ backgroundColor: 'var(--semi-grey-1)', marginBottom: '10px' }}
                defaultSize={{
                    width: 400,
                    height: 300,
                }}
                lockAspectRatio
            >
                <div style={{ marginLeft: '20%' }}>lock</div>
            </Resizable>
            <Resizable
                style={{ backgroundColor: 'var(--semi-grey-1)' }}
                defaultSize={{
                    width: 200,
                    height: (200 * 9) / 16,
                }}
                lockAspectRatio={16 / 9}
            >
                <div style={{ marginLeft: '20%' }}>16 / 9</div>
            </Resizable>
        </div>
    );
}
