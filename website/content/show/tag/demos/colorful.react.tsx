import { IconAIFilledLevel1, IconAIFilledLevel3 } from '@fibrae/semi-icons-react';
import { Tag } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', rowGap: 30 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridGap: '10px', width: 'fit-content' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridGap: '10px', width: 'fit-content' }}>
                <Tag colorful prefixIcon={<IconAIFilledLevel1 size="small" />} type="solid" gradient>
                    AI
                </Tag>
                <Tag colorful prefixIcon={<IconAIFilledLevel3 size="small" />} type="light" gradient>
                    AI
                </Tag>
                <Tag colorful prefixIcon={<IconAIFilledLevel3 size="small" />} type="ghost" gradient>
                    AI
                </Tag>
                <Tag colorful prefixIcon={<IconAIFilledLevel1 size="small" />} type="solid">
                    AI
                </Tag>
                <Tag colorful prefixIcon={<IconAIFilledLevel1 size="small" />} type="light">
                    AI
                </Tag>
                <Tag colorful prefixIcon={<IconAIFilledLevel1 size="small" />} type="ghost">
                    AI
                </Tag>
            </div>
        </div>
    );
}
