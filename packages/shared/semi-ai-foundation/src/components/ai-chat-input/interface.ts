import type { BaseFileItem } from '@fibrae/semi-foundation/components/upload/foundation';

export interface RichTextJSON {
    type: string;
    [key: string]: any;
}

export interface BaseSkill {
    icon?: any;
    value?: string;
    label?: string;
    hasTemplate?: boolean;
    [key: string]: any;
}

export type Suggestion =
    | string
    | {
          content: string;
          [key: string]: any;
      };

export interface Attachment extends BaseFileItem {
    validateMessage?: any;
    type?: 'file' | 'directory';
    children?: Attachment[];
}

export interface Reference {
    type?: string;
    id: string;
    [key: string]: any;
}

export interface Content {
    type: string;
    [key: string]: any;
}

/** The configure area's values by field, also sent as `MessageContent.setup` */
export interface Setup {
    [key: string]: any;
}

export interface MessageContent {
    references?: Reference[];
    attachments?: Attachment[];
    inputContents?: Content[];
    setup?: Setup;
}
