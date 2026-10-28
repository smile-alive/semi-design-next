import React from 'react';
import { DragMove } from '@fibrae/semi-ui-react';

export default function DragMoveDemo() {
    const containerRef = React.useRef<HTMLDivElement>(null);

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
            ref={containerRef}
        >
            <span style={{ color: 'var(--semi-color-text-0)' }}>Constrainer</span>
            <DragMove constrainer={() => containerRef.current}>
                <div
                    style={{
                        backgroundColor: 'var(--semi-color-primary)',
                        width: 80,
                        height: 80,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'absolute',
                        top: 80,
                        left: 80,
                    }}
                >
                    Drag me
                </div>
            </DragMove>
        </div>
    );
}
