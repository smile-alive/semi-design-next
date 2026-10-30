import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { StepStatus } from '@fibrae/semi-foundation/steps/utils';

export type { StepStatus };
export type StepsSize = 'default' | 'small';
export type StepsDirection = 'horizontal' | 'vertical';
export type StepsType = 'fill' | 'basic' | 'nav';

/** One step of `dataSource`; nodes for its title and description come from the Steps snippets. Other attributes land on the step's root. */
export interface StepData extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onclick'> {
    /** Own status; when omitted it follows the Steps' current and status */
    status?: StepStatus;
    title?: string | number;
    /** Not rendered by the nav type */
    description?: string | number;
    /** Custom icon of this step; `false` draws an empty icon area; when omitted the built-in status icon is used. Not rendered by the nav type */
    icon?: Snippet | false;
    /** Its presence makes this step clickable, whatever the Steps' `onChange` */
    onClick?: (event: MouseEvent) => void;
}

export interface StepSnippetProps {
    item: StepData;
    index: number;
}

/**
 * One interface for the three types: `size` applies to basic and nav, `hasLine` to basic, `status` and
 * `direction` to fill and basic; the others ignore them.
 */
export interface StepsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    type?: StepsType;
    current?: number;
    initial?: number;
    direction?: StepsDirection;
    status?: StepStatus;
    size?: StepsSize;
    hasLine?: boolean;
    prefixCls?: string;
    dataSource?: StepData[];
    /** Not bindable: whether it is set decides if the steps are buttons, and Svelte cannot tell a `bind:` from a plain prop */
    onChange?: (current: number) => void;
    /** Title of each step; defaults to `item.title` */
    title?: Snippet<[StepSnippetProps]>;
    /** Description of each step; defaults to `item.description`. Not rendered by the nav type */
    description?: Snippet<[StepSnippetProps]>;
}
