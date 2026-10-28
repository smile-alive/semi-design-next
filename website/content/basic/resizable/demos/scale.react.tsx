import { Resizable } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    return (
        <div style={{ width: '500px', height: '60%', transform: 'scale(0.5)', transformOrigin: '0 0' }}>
            <Resizable
                style={{ backgroundColor: 'var(--semi-grey-1)' }}
                defaultSize={{
                    width: '60%',
                    height: '60%',
                }}
                scale={0.5}
            >
                <div style={{ marginLeft: '20%' }}>scale 0.5</div>
            </Resizable>
        </div>
    );
}
