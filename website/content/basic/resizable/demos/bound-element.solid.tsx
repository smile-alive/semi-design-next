import { Resizable } from '@fibrae/semi-ui-solid';

export default function ResizableDemo() {
    return (
        <div style={{ width: '300px', height: '300px', border: 'var(--semi-color-border) 1px solid' }}>
            <Resizable
                style={{ 'margin-inline-start': '20%', 'background-color': 'var(--semi-grey-1)' }}
                defaultSize={{
                    width: '60%',
                    height: 200,
                }}
                boundElement="parent"
            >
                <div style={{ 'margin-inline-start': '20%' }}>bound：parent</div>
            </Resizable>
        </div>
    );
}
