import { Resizable } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    return (
        <div style={{ width: '500px', height: '60%' }}>
            <Resizable
                style={{ backgroundColor: 'var(--semi-grey-1)' }}
                ratio={2}
                defaultSize={{
                    width: 200,
                    height: 200,
                }}
            >
                <div style={{ marginLeft: '20%' }}>ratio=2</div>
            </Resizable>
        </div>
    );
}
