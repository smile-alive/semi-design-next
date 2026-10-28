import { For } from 'solid-js';
import { IconAIBellLevel1, IconAIEditLevel2, IconAIFileLevel3, IconAIFilledLevel3, IconAIImageLevel3, IconAISearchLevel3, IconAIStrokedLevel3, IconAIWandLevel3, IconAILoading, IconAIFilledLevel1, IconAIEditLevel1 } from '@fibrae/semi-icons-solid';
import { Typography, Button, Tag, FloatButton } from '@fibrae/semi-ui-solid';

const shades = Array.from({ length: 10 }, (_, index) => index);

export default function AIComponentDemo() {
    return (
        <div style={{ display: 'flex', 'flex-direction': 'column', 'row-gap': '20px' }}>
            <div style={{ display: 'flex', 'flex-direction': 'column', 'row-gap': '10px' }}>
                <Typography.Title heading={5}>AI Token</Typography.Title>
                <div style={{ display: 'flex', 'align-items': 'center', 'column-gap': '10px' }}>
                    <span>Purple</span>
                    <div style={{ display: 'inline-flex', 'column-gap': '4px' }}>
                        <For each={shades}>
                            {(index) => (
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        background: `var(--semi-ai-purple-${index})`,
                                        'border-radius': '50%',
                                    }}
                                />
                            )}
                        </For>
                    </div>
                </div>
                <div style={{ display: 'flex', 'align-items': 'center', 'column-gap': '10px' }}>
                    <span>General</span>
                    <div style={{ display: 'inline-flex', 'column-gap': '4px' }}>
                        <For each={shades}>
                            {(index) => (
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        background: `var(--semi-ai-general-${index})`,
                                        'border-radius': '50%',
                                    }}
                                />
                            )}
                        </For>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', 'flex-direction': 'column', 'row-gap': '10px' }}>
                <Typography.Title heading={5}>AI Icon</Typography.Title>
                <div style={{ display: 'flex', 'column-gap': '10px' }}>
                    <IconAIBellLevel1 size="extra-large" />
                    <IconAIEditLevel2 size="extra-large" />
                    <IconAIFileLevel3 size="extra-large" />
                    <IconAIFilledLevel3 size="extra-large" />
                    <IconAIImageLevel3 size="extra-large" />
                    <IconAISearchLevel3 size="extra-large" />
                    <IconAIStrokedLevel3 size="extra-large" />
                    <IconAIWandLevel3 fill={['var(--semi-color-danger)', 'var(--semi-color-success)', 'var(--semi-color-primary)', 'var(--semi-color-warning)']} size="extra-large" />
                    <IconAILoading size="extra-large" />
                </div>
            </div>
            <div style={{ display: 'flex', 'flex-direction': 'column', 'row-gap': '10px' }}>
                <Typography.Title heading={5}>AI Button</Typography.Title>
                <div style={{ display: 'flex', 'row-gap': '16px', 'flex-direction': 'column' }}>
                    <div style={{ display: 'flex', 'column-gap': '16px' }}>
                        <Button colorful theme="solid" type="primary" icon={<IconAIFilledLevel1 />}>
                            Colorful
                        </Button>
                        <Button colorful theme="solid" type="primary" loading>
                            Colorful
                        </Button>
                        <Button colorful theme="solid" type="primary" icon={<IconAIFilledLevel1 />} disabled>
                            Colorful
                        </Button>
                    </div>
                    <div style={{ display: 'flex', 'column-gap': '16px' }}>
                        <Button colorful theme="solid" type="tertiary" icon={<IconAIFilledLevel3 />}>
                            Colorful
                        </Button>
                        <Button colorful theme="solid" type="tertiary" loading>
                            Colorful
                        </Button>
                        <Button colorful theme="solid" type="tertiary" icon={<IconAIFilledLevel3 />} disabled>
                            Colorful
                        </Button>
                    </div>
                    <div style={{ display: 'flex', 'column-gap': '16px' }}>
                        <Button colorful aria-label="AI" theme="solid" type="primary" icon={<IconAIFilledLevel1 />} />
                        <Button colorful aria-label="AI" theme="solid" type="primary" loading />
                        <Button colorful aria-label="AI" theme="solid" type="primary" icon={<IconAIFilledLevel1 />} disabled />
                        <Button colorful aria-label="AI" theme="solid" type="tertiary" icon={<IconAIFilledLevel3 />} />
                        <Button colorful aria-label="AI" theme="solid" type="tertiary" loading />
                        <Button colorful aria-label="AI" theme="solid" type="tertiary" icon={<IconAIFilledLevel3 />} disabled />
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', 'flex-direction': 'column', 'row-gap': '10px' }}>
                <Typography.Title heading={5} style={{ 'margin-top': '10px' }}>
                    AI Tag
                </Typography.Title>
                <div
                    style={{
                        display: 'grid',
                        'grid-template-columns': 'repeat(3,1fr)',
                        'grid-gap': '10px',
                        width: 'fit-content',
                    }}
                >
                    <Tag colorful prefixIcon={<IconAIFilledLevel1 size="small" />} type="solid" shape="circle" gradient>
                        AI
                    </Tag>
                    <Tag colorful prefixIcon={<IconAIFilledLevel3 size="small" />} type="light" shape="circle" gradient>
                        AI
                    </Tag>
                    <Tag colorful prefixIcon={<IconAIFilledLevel3 size="small" />} type="ghost" shape="circle" gradient>
                        AI
                    </Tag>
                    <Tag colorful prefixIcon={<IconAIFilledLevel1 size="small" />} type="solid" shape="circle">
                        AI
                    </Tag>
                    <Tag colorful prefixIcon={<IconAIFilledLevel1 size="small" />} type="light" shape="circle">
                        AI
                    </Tag>
                    <Tag colorful prefixIcon={<IconAIFilledLevel1 size="small" />} type="ghost" shape="circle">
                        AI
                    </Tag>
                </div>
            </div>
            <div style={{ display: 'flex', 'flex-direction': 'column', 'row-gap': '10px' }}>
                <Typography.Title heading={5} style={{ 'margin-top': '10px' }}>
                    AI FloatButton
                </Typography.Title>
                <div
                    style={{
                        display: 'grid',
                        'grid-template-columns': 'repeat(3,1fr)',
                        'grid-gap': '10px',
                        width: 'fit-content',
                    }}
                >
                    <FloatButton aria-label="AI edit, VIP" icon={<IconAIEditLevel1 />} colorful size="large" badge={{ count: 'VIP', type: 'danger' }} style={{ position: 'static' }} />
                </div>
            </div>
        </div>
    );
}
