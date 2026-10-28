import { DragMove } from '@fibrae/semi-ui-solid';

export default function DragMoveDemo() {
    let container: HTMLDivElement | undefined;

    return (
        <div
            ref={(element) => (container = element)}
            style={{
                'background-color': 'var(--semi-grey-2)',
                width: '300px',
                height: '300px',
                padding: '5px',
                position: 'relative',
                color: 'var(--semi-white)',
                'font-weight': '500',
            }}
        >
            <span style={{ color: 'var(--semi-color-text-0)' }}>Constrainer</span>
            <DragMove constrainer={() => container ?? null}>
                <div
                    style={{
                        'background-color': 'var(--semi-color-primary)',
                        width: '80px',
                        height: '80px',
                        'border-radius': '10px',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        position: 'absolute',
                        top: '80px',
                        left: '80px',
                    }}
                >
                    Drag me
                </div>
            </DragMove>
        </div>
    );
}
