import { Resizable } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    return (
        <div style={{ width: '300px', height: '300px', border: 'var(--semi-color-border) 1px solid' }}>
            <Resizable
                style={{ marginLeft: '20%', backgroundColor: 'var(--semi-grey-1)' }}
                defaultSize={{
                    width: '60%',
                    height: 200,
                }}
                boundElement="parent"
            >
                <div style={{ marginLeft: '20%' }}>bound：parent</div>
            </Resizable>
        </div>
    );
}
