import { Resizable } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    return (
        <div style={{ width: '500px', height: '60%' }}>
            <Resizable
                style={{ backgroundColor: 'var(--semi-grey-1)' }}
                maxWidth={200}
                maxHeight={300}
                minWidth={50}
                minHeight={50}
                defaultSize={{
                    width: 100,
                    height: 100,
                }}
            >
                <div style={{ marginLeft: '20%' }}>width在50到200之间，height在50到300之间</div>
            </Resizable>
        </div>
    );
}
