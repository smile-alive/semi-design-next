import { IconTransparentStroked } from '@fibrae/semi-icons-solid';
import { DragMove } from '@fibrae/semi-ui-solid';

export default function DragMoveDemo() {
    let handlerElement: HTMLDivElement | undefined;
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
            <DragMove handler={() => handlerElement ?? null} constrainer={() => container ?? null}>
                <div
                    style={{
                        'background-color': 'var(--semi-color-primary)',
                        width: '80px',
                        height: '80px',
                        'border-radius': '10px',
                        position: 'absolute',
                        top: '50px',
                        left: '50px',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                    }}
                >
                    <div ref={(element) => (handlerElement = element)} style={{ width: 'fit-content', height: 'fit-content' }}>
                        <IconTransparentStroked size="large" />
                    </div>
                </div>
            </DragMove>
        </div>
    );
}
