import { IconAIBellLevel3, IconAIWandLevel3, IconAIFilledLevel3 } from '@fibrae/semi-icons-solid';

export default function IconDemo() {
    return (
        <div>
            <IconAIBellLevel3 style={{ 'margin-right': '10px' }} size="extra-large" />
            <IconAIWandLevel3 fill={['var(--semi-color-danger)', 'var(--semi-color-success)', 'var(--semi-color-primary)', 'var(--semi-color-warning)']} style={{ 'margin-right': '10px' }} size="extra-large" />
            <IconAIFilledLevel3 fill={['var(--semi-color-primary)', 'var(--semi-color-success)']} size="extra-large" />
        </div>
    );
}
