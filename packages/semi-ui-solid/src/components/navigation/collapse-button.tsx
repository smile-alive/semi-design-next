import { cssClasses } from '@fibrae/semi-foundation/components/navigation/constants';
import { IconSidebar } from '@fibrae/semi-icons-solid';
import Button from '../button';
import Tooltip, { type GetTriggerProps } from '../tooltip';
import type { CollapseButtonProps } from './interface';

export default function CollapseButton(props: CollapseButtonProps) {
    const label = () => (typeof props.collapseText === 'function' ? props.collapseText(props.isCollapsed!) : props.isCollapsed ? props.locale?.expandText : props.locale?.collapseText);

    // One element tree for both states: swapping the wrapper would remount the button and drop the focus it holds
    return (
        <div class={`${cssClasses.PREFIX}-collapse-btn`}>
            <Tooltip condition={Boolean(props.isCollapsed)} content={label()} position="right">
                {(trigger: GetTriggerProps) => (
                    <Button
                        {...trigger({
                            get 'aria-label'() {
                                if (!props.isCollapsed) {
                                    return undefined;
                                }
                                const text = label();
                                return typeof text === 'string' ? text : props.locale?.expandText;
                            },
                        })}
                        icon={<IconSidebar />}
                        type="tertiary"
                        theme="borderless"
                        onClick={() => props.onClick?.(!props.isCollapsed)}
                    >
                        {props.isCollapsed ? undefined : label()}
                    </Button>
                )}
            </Tooltip>
        </div>
    );
}
