import { IconAIFilledLevel1, IconAIFilledLevel2, IconAIFilledLevel3 } from '@fibrae/semi-icons-react';
import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <>
            {['Colorful', undefined].map((content) => (
                <div key={content ?? 'icon-only'} style={{ display: 'flex', rowGap: 16, marginTop: 20, marginLeft: 10, flexDirection: 'column' }}>
                    <div style={{ display: 'flex', columnGap: 16 }}>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="solid" type="primary" icon={<IconAIFilledLevel1 />}>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="solid" type="primary" loading>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="solid" type="primary" icon={<IconAIFilledLevel1 />} disabled>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="solid" type="tertiary" icon={<IconAIFilledLevel3 />}>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="solid" type="tertiary" loading>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="solid" type="tertiary" icon={<IconAIFilledLevel3 />} disabled>
                            {content}
                        </Button>
                    </div>
                    <div style={{ display: 'flex', columnGap: 16 }}>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="light" type="primary" icon={<IconAIFilledLevel3 />}>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="light" type="primary" loading>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="light" type="primary" icon={<IconAIFilledLevel3 />} disabled>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="light" type="tertiary" icon={<IconAIFilledLevel2 />}>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="light" type="tertiary" loading>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="light" type="tertiary" icon={<IconAIFilledLevel2 />} disabled>
                            {content}
                        </Button>
                    </div>
                    <div style={{ display: 'flex', columnGap: 16 }}>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="outline" type="primary" icon={<IconAIFilledLevel1 />}>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="outline" type="primary" loading>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="outline" type="primary" icon={<IconAIFilledLevel1 />} disabled>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="outline" type="tertiary" icon={<IconAIFilledLevel2 />}>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="outline" type="tertiary" loading>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="outline" type="tertiary" icon={<IconAIFilledLevel2 />} disabled>
                            {content}
                        </Button>
                    </div>
                    <div style={{ display: 'flex', columnGap: 16 }}>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="borderless" type="primary" icon={<IconAIFilledLevel3 />}>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="borderless" type="primary" loading>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="borderless" type="primary" icon={<IconAIFilledLevel3 />} disabled>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="borderless" type="tertiary" icon={<IconAIFilledLevel2 />}>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="borderless" type="tertiary" loading>
                            {content}
                        </Button>
                        <Button colorful aria-label={content ? undefined : 'AI'} theme="borderless" type="tertiary" icon={<IconAIFilledLevel2 />} disabled>
                            {content}
                        </Button>
                    </div>
                </div>
            ))}
        </>
    );
}
