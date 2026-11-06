import React from 'react';
import { IconTransparentStroked } from '@fibrae/semi-icons-react';
import { DragMove } from '@fibrae/semi-ui-react';

export default function DragMoveDemo() {
    const handlerEl = React.useRef<HTMLDivElement>(null);
    const container = React.useRef<HTMLDivElement>(null);

    return (
        <div
            style={{
                backgroundColor: 'var(--semi-grey-2)',
                width: 300,
                height: 300,
                padding: 5,
                position: 'relative',
                color: 'var(--semi-white)',
                fontWeight: 500,
            }}
            ref={container}
        >
            <span style={{ color: 'var(--semi-color-text-0)' }}>Constrainer</span>
            <DragMove handler={() => handlerEl.current} constrainer={() => container.current}>
                <div
                    style={{
                        backgroundColor: 'var(--semi-color-primary)',
                        width: 80,
                        height: 80,
                        borderRadius: 10,
                        position: 'absolute',
                        top: 50,
                        left: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ width: 'fit-content', height: 'fit-content' }} ref={handlerEl}>
                        <IconTransparentStroked size="large" />
                    </div>
                </div>
            </DragMove>
        </div>
    );
}
