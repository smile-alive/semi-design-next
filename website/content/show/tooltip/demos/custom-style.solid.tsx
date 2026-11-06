import { Tag, Tooltip } from '@fibrae/semi-ui-solid';

export default function TooltipDemo() {
    return (
        <div>
            <Tooltip style={{ 'max-width': '320px' }} class="another-classname" content="hi semi semi semi semi semi semi semi">
                {(trigger) => (
                    <Tag style={{ 'margin-inline-end': '8px' }} {...trigger()}>
                        Custom Style And ClassName
                    </Tag>
                )}
            </Tooltip>
        </div>
    );
}
