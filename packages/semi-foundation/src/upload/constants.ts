import { VALIDATE_STATUS, BASE_CLASS_PREFIX } from '../base/constants';
const PREFIX = `${BASE_CLASS_PREFIX}-upload`;

const FILE_LIST_PIC = 'picture' as const;
const FILE_LIST_DEFAULT = 'list' as const;
const FILE_LIST_NONE = 'none' as const;
const PROGRESS_COEFFICIENT = 0.95;

export const cssClasses = {
    PREFIX,
    LIST: `${PREFIX}-list`,
};

const TRIGGER_AUTO = 'auto' as const;
const TRIGGER_CUSTOM = 'custom' as const;

export const strings = {
    FILE_STATUS_UPLOADING: 'uploading',
    FILE_STATUS_SUCCESS: 'success',
    FILE_STATUS_UPLOAD_FAIL: 'uploadFail',
    FILE_STATUS_VALIDATING: 'validating',
    FILE_STATUS_VALID_FAIL: 'validateFail',
    FILE_STATUS_WAIT_UPLOAD: 'wait',

    FILE_LIST_PIC,
    FILE_LIST_DEFAULT,
    LIST_TYPE: [FILE_LIST_PIC, FILE_LIST_DEFAULT, FILE_LIST_NONE],
    DRAG_AREA_DEFAULT: 'default',
    DRAG_AREA_LEGAL: 'legal',
    TRIGGER_AUTO,
    TRIGGER_CUSTOM,
    VALIDATE_STATUS,
    PROMPT_POSITION: ['left', 'right', 'bottom'] as const,
};

export const numbers = {
    PROGRESS_COEFFICIENT,
};
