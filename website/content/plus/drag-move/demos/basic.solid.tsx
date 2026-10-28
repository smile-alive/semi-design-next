import { DragMove } from '@fibrae/semi-ui-solid';

export default function DragMoveDemo() {
    // DragMove positions the element absolutely, so the wrapper keeps room for it in the preview
    return (
        <div style={{ height: '120px' }}>
            <DragMove>
                <div
                    style={{
                        'background-color': 'var(--semi-color-primary)',
                        width: '80px',
                        height: '80px',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'border-radius': '10px',
                        'font-weight': '500',
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
