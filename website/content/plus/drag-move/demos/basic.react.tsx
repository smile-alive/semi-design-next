import { DragMove } from '@fibrae/semi-ui-react';

export default function DragMoveDemo() {
    // DragMove positions the element absolutely, so the wrapper keeps room for it in the preview
    return (
        <div style={{ height: 120 }}>
            <DragMove>
                <div
                    style={{
                        backgroundColor: 'var(--semi-color-primary)',
                        width: 80,
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        fontWeight: 500,
                        position: 'absolute',
                        color: 'var(--semi-white)',
                    }}
                >
                    Drag me
                </div>
            </DragMove>
        </div>
    );
}
