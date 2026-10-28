import { IconTransfer } from '@fibrae/semi-icons-solid/lab';
import { Resizable } from '@fibrae/semi-ui-solid';

export default function ResizableDemo() {
    return (
        <div style={{ width: '500px', height: '60%' }}>
            <Resizable
                style={{
                    'margin-left': '20%',
                    'background-color': 'var(--semi-grey-1)',
                    border: 'var(--semi-color-border) 1px solid',
                }}
                defaultSize={{
                    width: '60%',
                    height: 300,
                }}
                renderHandle={(direction) =>
                    direction === 'right' ? (
                        <div
                            style={{
                                height: '100%',
                                display: 'flex',
                                'align-items': 'center',
                                width: 'fit-content',
                            }}
                        >
                            <IconTransfer />
                        </div>
                    ) : undefined
                }
            >
                <div style={{ 'margin-left': '20%' }}>right</div>
            </Resizable>
        </div>
    );
}
