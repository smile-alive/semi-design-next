import { Resizable } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    return (
        <div style={{ width: '500px', height: '60%' }}>
            <Resizable
                style={{
                    marginLeft: '20%',
                    backgroundColor: 'var(--semi-grey-1)',
                    border: 'var(--semi-color-border) 1px solid',
                }}
                defaultSize={{
                    width: '60%',
                    height: 300,
                }}
                grid={[100, 100]}
                snapGap={20}
            >
                <div style={{ marginLeft: '20%' }}>snap</div>
            </Resizable>
        </div>
    );
}
