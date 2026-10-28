import type { Locale as dateFnsLocale } from 'date-fns';

/** Keys of `Locale` that hold a component's strings */
export type LocaleComponentName = Exclude<keyof Locale, 'code' | 'dateFnsLocale' | 'currency'>;

export interface LocaleResult<T> {
    /** `locale[componentName]`: the component's own strings */
    locale: T;
    localeCode: string;
    /** For formatting dates in the locale's language, e.g. `format(date, 'EEEE', { locale: dateFnsLocale })` */
    dateFnsLocale: dateFnsLocale;
    currency: string;
}

export interface Locale {
    code: string;
    dateFnsLocale: dateFnsLocale;
    /** ISO 4217 code, passed to Intl.NumberFormat by InputNumber */
    currency: string;
    Pagination: {
        pageSize: string;
        total: string;
        jumpTo: string;
        page: string;
        prev: string;
        next: string;
        pageSizeSelector: string;
        /** name of the ellipsis item that stands for hidden pages */
        more: string;
        /** `${page}` is the page number */
        pageN: string;
    };
    Tag: {
        /** `${tag}` is the text of the tag */
        tag: string;
        closableTag: string;
    };
    Toast: {
        /** name of the button that dismisses the toast */
        close: string;
        default: string;
        info: string;
        success: string;
        warning: string;
        error: string;
    };
    Slider: {
        /** Name suffix of the first handle of a range slider */
        rangeStart: string;
        /** Name suffix of the last handle of a range slider */
        rangeEnd: string;
    };
    PinCode: {
        /** `${index}` and `${count}` stand for the 1-based position and the total */
        digit: string;
    };
    Spin: {
        loading: string;
    };
    Anchor: {
        label: string;
    };
    Avatar: {
        /** name of the "+N" avatar; `${count}` is the number of hidden avatars */
        more: string;
    };
    Rating: {
        /** `${value}`, `${count}` and `${unit}` (star or stars) */
        label: string;
        /** `${value}` and `${unit}` */
        itemLabel: string;
        star: string;
        stars: string;
    };
    Banner: {
        close: string;
        warning: string;
        success: string;
        info: string;
        danger: string;
    };
    BackTop: {
        backToTop: string;
    };
    Breadcrumb: {
        label: string;
        expand: string;
    };
    Carousel: {
        prev: string;
        next: string;
        /** name of the tablist made of the indicators */
        indicators: string;
        /** `${index}` is the 1-based slide number */
        slideN: string;
        /** aria-roledescription of the carousel, lowercase like a role name */
        carousel: string;
        /** aria-roledescription of a slide when there are no indicators */
        slide: string;
    };
    ColorPicker: {
        alpha: string;
        color: string;
        /** name of the select that switches between hex, rgba and hsva */
        format: string;
        /** name of the hue slider */
        hue: string;
        /** name of the slider that sets saturation in the color area */
        saturation: string;
        /** name of the slider that sets brightness in the color area */
        brightness: string;
        /** `${saturation}` and `${brightness}` are percentages */
        saturationBrightness: string;
        /** name of the button that picks a color from the screen */
        eyeDropper: string;
    };
    Input: {
        showPassword: string;
        hidePassword: string;
        group: string;
        /** name of the icon-only button that clears the value */
        clear: string;
    };
    SideSheet: {
        close: string;
    };
    TagInput: {
        clear: string;
        /** fallback name of the input when the caller gives none */
        input: string;
        /** name of the handle that reorders a tag with drag or keyboard */
        dragSort: string;
    };
    Modal: {
        close: string;
        confirm: string;
        cancel: string;
    };
    Tabs: {
        more: string;
        close: string;
        prevTabs: string;
        nextTabs: string;
    };
    TimePicker: {
        placeholder: {
            time: string;
            timeRange: string;
        };
        begin: string;
        end: string;
        hour: string;
        minute: string;
        second: string;
        AM: string;
        PM: string;
        /** names of the hour, minute, second and AM/PM lists; `hour`, `minute` and `second` are unit suffixes */
        hourList: string;
        minuteList: string;
        secondList: string;
        ampmList: string;
        /** name of the panel dialog, by type */
        panel: {
            time: string;
            timeRange: string;
        };
    };
    DatePicker: {
        placeholder: {
            date: string;
            dateTime: string;
            dateRange: [string, string];
            dateTimeRange: [string, string];
            monthRange: [string, string];
        };
        presets: string;
        footer: {
            confirm: string;
            cancel: string;
        };
        selectDate: string;
        selectTime: string;
        year: string;
        month: string;
        monthText: string;
        /** Selected entry of the year scroll column; `${year}` is the year number */
        yearText: string;
        months: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
        };
        fullMonths: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
        };
        weeks: {
            Mon: string;
            Tue: string;
            Wed: string;
            Thu: string;
            Fri: string;
            Sat: string;
            Sun: string;
        };
        localeFormatToken: {
            FORMAT_SWITCH_DATE: string;
        };
        prevYear: string;
        prevMonth: string;
        nextMonth: string;
        nextYear: string;
        switchToDate: string;
        switchToTime: string;
        clearRange: string;
        changeDate: string;
        chooseDate: string;
        /** name of the panel dialog, by type */
        panel: {
            date: string;
            dateTime: string;
            dateRange: string;
            dateTimeRange: string;
            month: string;
            monthRange: string;
            year: string;
        };
    };
    Navigation: {
        collapseText: string;
        expandText: string;
    };
    Notification: {
        /** name of the button that dismisses the notice */
        close: string;
    };
    Popconfirm: {
        /** name of the button that dismisses the popconfirm */
        close: string;
        confirm: string;
        cancel: string;
    };
    Table: {
        emptyText: string;
        pageText: string;
        descend: string;
        ascend: string;
        cancelSort: string;
        confirmFilter: string;
        resetFilter: string;
        filterColumn: string;
        /** name of the default filter button while the column's filter is applied */
        filterColumnActive: string;
        expandRow: string;
        /** visually hidden header text of the column that holds the expand buttons */
        expandColumn: string;
        selectAllRows: string;
        selectRow: string;
    };
    Select: {
        emptyText: string;
        createText: string;
        /** default name of the combobox and its search input */
        label: string;
        /** name of the icon-only button that clears the selection */
        clear: string;
    };
    Cascader: {
        /** name of the icon-only button that clears the selection */
        clear: string;
        emptyText: string;
        /** default name of the trigger and its search input */
        label: string;
    };
    Tree: {
        emptyText: string;
        searchPlaceholder: string;
        filter: string;
    };
    List: {
        emptyText: string;
    };
    Calendar: {
        /** name of the button that closes the day card */
        close: string;
        allDay: string;
        AM: string;
        PM: string;
        datestring: string;
        remaining: string;
    };
    Upload: {
        /** name of the button that removes a file from the list */
        remove: string;
        /** name of the keyboard target that opens the preview of a file */
        preview: string;
        /** fallback name of the add area when its content has no text */
        upload: string;
        mainText: string;
        legalTips: string;
        retry: string;
        clear: string;
        selectedFiles: string;
        replace: string;
        illegalSize: string;
        fail: string;
        cropTitle: string;
        pictureList: string;
        fileList: string;
        uploadProgress: string;
    };
    TreeSelect: {
        searchPlaceholder: string;
        /** default name of the trigger and its search input */
        label: string;
        filter: string;
        clear: string;
    };
    Typography: {
        copy: string;
        copied: string;
        expand: string;
        collapse: string;
    };
    Transfer: {
        emptyLeft: string;
        emptySearch: string;
        emptyRight: string;
        placeholder: string;
        clear: string;
        selectAll: string;
        clearSelectAll: string;
        total: string;
        selected: string;
        selectedList: string;
        optionList: string;
        filter: string;
        dragSort: string;
        /** name of the button that removes an item from the selected list */
        remove: string;
    };
    Form: {
        optional: string;
    };
    Image: {
        preview: string;
        prevTip: string;
        nextTip: string;
        zoomInTip: string;
        zoomOutTip: string;
        rotateTip: string;
        downloadTip: string;
        adaptiveTip: string;
        originTip: string;
        /** name of the preview's close button */
        close: string;
        /** name of the preview's zoom slider */
        zoom: string;
        /** alt of the fallback image shown when loading fails */
        fallback: string;
    };
    Chat: {
        /** name of the button that scrolls the message list to the latest message */
        backToBottom: string;
        /** name of the button that regenerates a reply */
        regenerate: string;
        like: string;
        dislike: string;
        /** name of the button that deletes a message */
        delete: string;
        /** name of the button that clears the conversation context */
        clear: string;
        /** name of the default attachment upload button */
        upload: string;
        /** name of the send button */
        send: string;
        deleteConfirm: string;
        clearContext: string;
        copySuccess: string;
        stop: string;
        copy: string;
        copied: string;
        dropAreaText: string;
        uploadProgress: string;
        /** name of the button that removes an attachment from the pending message */
        removeAttachment: string;
        /** name of the message textarea */
        input: string;
        /** alt of an image attachment that has no name */
        image: string;
        /** name of the message list, a role="log" region */
        messages: string;
    };
    UserGuide: {
        skip: string;
        next: string;
        prev: string;
        finish: string;
    };
    InputNumber: Record<string, never>;
    JsonViewer: {
        /** name of the button that jumps to the previous search match */
        previousMatch: string;
        /** name of the button that jumps to the next search match */
        nextMatch: string;
        /** name of the button that closes the search bar */
        close: string;
        search: string;
        replace: string;
        replaceAll: string;
        /** name of the toggle that makes the search match case */
        caseSensitive: string;
        /** name of the toggle that treats the search text as a regular expression */
        regex: string;
        /** name of the toggle that makes the search match whole words only */
        wholeWord: string;
        /** name of the content area: the read-only viewer's scroll region, or the editor's textbox */
        content: string;
    };
    VideoPlayer: {
        rateChange: string;
        qualityChange: string;
        routeChange: string;
        mirror: string;
        cancelMirror: string;
        loading: string;
        stall: string;
        noResource: string;
        videoError: string;
        play: string;
        pause: string;
        next: string;
        volume: string;
        fullscreen: string;
        exitFullscreen: string;
        pictureInPicture: string;
        /** what the playback rate menu button is for, read before its current rate */
        playbackRate: string;
        /** what the quality menu button is for, read before its current quality */
        quality: string;
        /** what the route menu button is for, read before its current route */
        route: string;
        /** alt of the poster image */
        poster: string;
        /** name of the progress slider */
        progress: string;
        /** spoken time with hours, `${hours}`, `${minutes}` and `${seconds}` are numbers */
        timeHms: string;
        /** spoken time under one hour, `${minutes}` and `${seconds}` are numbers */
        timeMs: string;
        /** spoken time under one minute, `${seconds}` is a number */
        timeS: string;
    };
    AIChatDialogue: {
        /** name of the button that scrolls the dialogue to the latest message */
        backToBottom: string;
        /** name of the button that regenerates a reply */
        regenerate: string;
        like: string;
        dislike: string;
        share: string;
        edit: string;
        /** name of the button that quotes a message into the input */
        reference: string;
        delete: string;
        deleteConfirm: string;
        deleteContent: string;
        copy: string;
        copySuccess: string;
        loading: string;
        reasoning: {
            completed: string;
            thinking: string;
        };
        annotationText: string;
        /** name of the more-actions button, and alt of the "+N" avatar that stands for further annotation sources */
        more: string;
        /** alt of an image in a message */
        image: string;
        /** name of the checkbox that selects a message in selecting mode */
        selectMessage: string;
        /** name of the message list, a role="log" region */
        messages: string;
    };
    Feedback: {
        placeholder: string;
        placeholderOptional: string;
        submit: string;
        cancel: string;
        /** name of the emoji radio group */
        rating: string;
        /** names of the emoji radios */
        bad: string;
        normal: string;
        good: string;
    };
    AIChatInput: {
        /** name of the rich text editor */
        input: string;
        /** name of the send button */
        send: string;
        /** name of the stop button shown while a reply is generating */
        stop: string;
        /** name of the default upload trigger */
        upload: string;
        template: string;
        configure: string;
        selected: string;
        uploadProgress: string;
        scrollLeft: string;
        scrollRight: string;
        /** name of the button that removes the selected skill from the input */
        removeSkill: string;
        /** name of the button that removes a quoted reference from the input */
        removeReference: string;
        /** name of the button that removes an uploaded attachment from the input */
        removeAttachment: string;
    };
    Sidebar: {
        linkAddSuccess: string;
        linkRemoveSuccess: string;
        enterLinkAddress: string;
        validateFailInfo: string;
        uploadFailInfo: string;
        uploadImgInfo: string;
        defaultMcpInfo: string;
        searchPlaceholder: string;
        emptyCustomMcpInfo: string;
        newMcpAdd: string;
        mcpConfigure: string;
        /** label of the option that lists the built-in MCP servers */
        mcpServers: string;
        annotationTitle: string;
        activeMCPNumber: string;
        copySuccess: string;
        close: string;
        /** name of the button that copies the detail content */
        copy: string;
        /** name of the button that expands a code or file block to the detail view */
        expand: string;
        /** name of the button that turns an MCP on */
        enable: string;
        /** name of the button that turns an MCP off */
        disable: string;
        /** name of the button that opens the configuration of an MCP */
        configure: string;
        /** name of the button that edits a custom MCP */
        edit: string;
        /** name of the button that applies the link typed in the editor toolbar */
        confirmLink: string;
        /** name of the button that removes the link of the selected text */
        removeLink: string;
        /** name of the editor toolbar button that undoes the last change */
        undo: string;
        /** name of the editor toolbar button that redoes an undone change */
        redo: string;
        /** name of the editor toolbar button that opens the heading level menu */
        heading: string;
        /** name of a heading level item in the heading menu; `${level}` is replaced with 1 to 6 */
        headingLevel: string;
        /** name of the editor toolbar button that turns the block into a paragraph */
        paragraph: string;
        /** name of the editor toolbar button that toggles a bulleted list */
        bulletList: string;
        /** name of the editor toolbar button that toggles a numbered list */
        orderedList: string;
        /** name of the editor toolbar button that wraps the block in a quote */
        blockquote: string;
        /** name of the editor toolbar button that toggles a code block */
        codeBlock: string;
        /** name of the editor toolbar button that inserts a horizontal rule */
        horizontalRule: string;
        /** name of the editor toolbar button that aligns the text to the left */
        alignLeft: string;
        /** name of the editor toolbar button that centers the text */
        alignCenter: string;
        /** name of the editor toolbar button that aligns the text to the right */
        alignRight: string;
        /** name of the editor toolbar button that justifies the text */
        alignJustify: string;
        /** name of the editor toolbar button that toggles bold text */
        bold: string;
        /** name of the editor toolbar button that toggles italic text */
        italic: string;
        /** name of the editor toolbar button that toggles strikethrough text */
        strike: string;
        /** name of the editor toolbar button that toggles inline code */
        code: string;
        /** name of the editor toolbar button that opens the link editor */
        link: string;
        /** name of the editor toolbar button that inserts an image */
        image: string;
    };
    AudioPlayer: {
        backward: string;
        forward: string;
        prev: string;
        next: string;
        loop: string;
        volume: string;
        mediaError: string;
        play: string;
        pause: string;
        refresh: string;
        /** what the playback rate menu button is for, read before its current rate */
        playbackRate: string;
        /** name of the progress slider */
        progress: string;
        /** spoken time with hours, `${hours}`, `${minutes}` and `${seconds}` are numbers */
        timeHms: string;
        /** spoken time under one hour, `${minutes}` and `${seconds}` are numbers */
        timeMs: string;
        /** spoken time under one minute, `${seconds}` is a number */
        timeS: string;
    };
    Resizable: {
        /** name of the separator between two ResizeGroup panes */
        separator: string;
        /** name of the handle that changes the width of a Resizable */
        resizeWidth: string;
        /** name of the handle that changes the height of a Resizable */
        resizeHeight: string;
    };
    Cropper: {
        /** name of the focusable crop box */
        cropArea: string;
        /** role description of the crop box */
        cropAreaRole: string;
        /** how to move and resize the crop box with the keyboard */
        cropAreaHelp: string;
    };
    /** drag sorting in TagInput and Transfer */
    Sortable: {
        /** role description of a drag handle */
        roleDescription: string;
        /** how to sort with the keyboard, read when a drag handle is focused */
        instructions: string;
        /** live announcement when an item is picked up, `${index}` is its 1-based position and `${total}` the count */
        pickedUp: string;
        /** live announcement when the item reaches a new position, `${index}` is that 1-based position */
        movedTo: string;
        /** live announcement when the item is dropped, `${index}` is its 1-based position */
        dropped: string;
        /** live announcement when the drag is canceled, `${index}` is the 1-based position it returns to */
        canceled: string;
    };
}
