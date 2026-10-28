import { For } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/video-player/constants';
import Dropdown from '../dropdown';
import type { VideoPlayerOption } from './interface';

const controlsCls = cssClasses.PREFIX_CONTROLS;

interface ControlsMenuProps<T> {
    current: T;
    /** What the menu sets, read before the current option in the button's name */
    label: string;
    list: VideoPlayerOption<T>[];
    onSelect: (option: VideoPlayerOption<T>) => void;
}

export default function ControlsMenu<T extends string | number>(props: ControlsMenuProps<T>) {
    const currentLabel = () => props.list.find((option) => option.value === props.current)?.label ?? String(props.current);

    return (
        <Dropdown
            class={`${controlsCls}-popup-menu`}
            position="top"
            render={
                <Dropdown.Menu>
                    <For each={props.list}>
                        {(option) => (
                            <Dropdown.Item class={`${controlsCls}-popup-menu-item`} active={option.value === props.current} onClick={() => props.onSelect(option)}>
                                {option.label}
                            </Dropdown.Item>
                        )}
                    </For>
                </Dropdown.Menu>
            }
            selectionMode="single"
        >
            {(getTriggerProps) => (
                // the visible text alone does not say what the menu sets
                <button {...getTriggerProps({ class: clsx(`${controlsCls}-menu-item`, `${controlsCls}-popup`) })} type="button" aria-label={[props.label, currentLabel()].filter(Boolean).join(' ')}>
                    {currentLabel()}
                </button>
            )}
        </Dropdown>
    );
}
