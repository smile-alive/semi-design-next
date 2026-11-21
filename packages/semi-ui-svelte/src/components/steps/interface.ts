import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { StepPart, StepsPart } from '@fibrae/semi-foundation/components/steps/constants';
import type { StepStatus } from '@fibrae/semi-foundation/components/steps/utils';

export type { StepStatus };
export type StepsSize = 'default' | 'small';
export type StepsDirection = 'horizontal' | 'vertical';
export type StepsType = 'basic' | 'nav';

/** One step of `dataSource`; nodes for its title and description come from the Steps snippets. Other attributes land on the step's root. */
export interface StepData extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onclick'> {
    status?: StepStatus;
    classNames?: Partial<Record<StepPart, ClassValue>>;
    styles?: Partial<Record<StepPart, string>>;
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
 * One interface for the two types: `size` applies to basic and nav, `hasLine`, `status` and `direction` to basic;
 * nav ignores them.
 */
export interface StepsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    type?: StepsType;
    current?: number;
    initial?: number;
    direction?: StepsDirection;
    status?: StepStatus;
    size?: StepsSize;
    hasLine?: boolean;
    dataSource?: StepData[];
    classNames?: Partial<Record<StepsPart, ClassValue>>;
    styles?: Partial<Record<StepsPart, string>>;
    /** Not bindable: whether it is set decides if the steps are buttons, and Svelte cannot tell a `bind:` from a plain prop */
    onChange?: (current: number) => void;
    title?: Snippet<[StepSnippetProps]>;
    /** Description of each step; defaults to `item.description`. Not rendered by the nav type */
    description?: Snippet<[StepSnippetProps]>;
}
