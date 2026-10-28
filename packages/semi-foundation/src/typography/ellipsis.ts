// JS text truncation, adapted from antd typography:
// https://github.com/ant-design/ant-design/blob/master/components/typography/util.tsx

let ellipsisContainer: HTMLElement;

const ellipsisStr = '...';

// Widget items, buttons and links already own focus; a tab stop inside would nest focusables
const WIDGET_ITEM = '[role="option"], [role="treeitem"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="gridcell"], [role="row"], button, [role="button"], [role="link"], a[href]';

/** The ellipsis fields the foundation resolves; `showTooltip` carries each framework's own tooltip config */
export interface EllipsisConfig<Tooltip> {
    collapseText?: string;
    collapsible?: boolean;
    expandText?: string;
    expandable?: boolean;
    pos?: 'end' | 'middle';
    rows?: number;
    showTooltip?: boolean | Tooltip;
    suffix?: string;
}

/** An unset field, or one explicitly undefined, takes the default; the expand and collapse texts default only when their button is enabled */
export function getEllipsisOpt<Tooltip>(ellipsis: EllipsisConfig<Tooltip> | boolean, expandStr: string, collapseStr: string): Required<Omit<EllipsisConfig<Tooltip>, 'expandText' | 'collapseText'>> & Pick<EllipsisConfig<Tooltip>, 'expandText' | 'collapseText'> {
    const config: EllipsisConfig<Tooltip> = typeof ellipsis === 'object' ? ellipsis : {};
    return {
        rows: config.rows ?? 1,
        expandable: config.expandable ?? false,
        pos: config.pos ?? 'end',
        suffix: config.suffix ?? '',
        showTooltip: config.showTooltip ?? false,
        collapsible: config.collapsible ?? false,
        expandText: config.expandText ?? (config.expandable ? expandStr : undefined),
        collapseText: config.collapseText ?? (config.collapsible ? collapseStr : undefined),
    };
}

/** Whether CSS can truncate the text; every other option needs the measured JS truncation */
export function canUseCSSEllipsis({ expandable, expandText, pos, suffix }: Pick<EllipsisConfig<unknown>, 'expandable' | 'expandText' | 'pos' | 'suffix'>, copyable: unknown) {
    return !expandable && expandText === undefined && !copyable && pos === 'end' && !suffix;
}

/** Whether `node` is, or holds, a focusable item; the copy button is not the tab stop, so it does not count */
export function isInsideWidgetItem(node: HTMLElement, copy?: Node | null) {
    const focusableDescendant = Array.from(node.querySelectorAll(WIDGET_ITEM)).some((item) => !copy?.contains(item));
    return node.closest(WIDGET_ITEM) !== null || focusableDescendant;
}

function pxToNumber(value: string) {
    if (!value) {
        return 0;
    }
    const match = value.match(/^\d*(\.\d*)?/);
    return match ? Number(match[0]) : 0;
}

function styleToString(style: CSSStyleDeclaration) {
    // Spread by hand: cssText serialization differs between browsers
    const styleNames = Array.from(style);
    return styleNames.map((name: string) => `${name}: ${style.getPropertyValue(name)};`).join('');
}

/** The longest text that, with the ellipsis, suffix and fixed nodes, fits in `rows` rows of `originEle` */
export function getRenderText(
    originEle: HTMLElement,
    rows: number,
    content = '',
    fixedContent: {
        expand: Node | null;
        copy: Node | null;
    },
    suffix: string,
    ellipsisPos: string,
    isStrong: boolean
) {
    if (content.length === 0) {
        return '';
    }
    // the host may have emptied body (a micro-frontend unmounting its app); a detached container has no layout
    if (!ellipsisContainer?.isConnected) {
        ellipsisContainer = document.createElement('div');
        ellipsisContainer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ellipsisContainer);
    }

    const originStyle = window.getComputedStyle(originEle);
    const originCSS = styleToString(originStyle);
    const lineHeight = pxToNumber(originStyle.lineHeight);
    const maxHeight = Math.round(lineHeight * (rows + 1) + pxToNumber(originStyle.paddingTop) + pxToNumber(originStyle.paddingBottom));

    ellipsisContainer.setAttribute('style', originCSS);
    ellipsisContainer.style.position = 'fixed';
    ellipsisContainer.style.left = '0';
    // getComputedStyle can report width 'auto'; fall back to the measured width
    if (originStyle.getPropertyValue('width') === 'auto' && originEle.offsetWidth) {
        ellipsisContainer.style.width = `${originEle.offsetWidth}px`;
    }
    ellipsisContainer.style.height = 'auto';
    ellipsisContainer.style.top = '-999999px';
    ellipsisContainer.style.zIndex = '-1000';
    if (isStrong) {
        ellipsisContainer.style.fontWeight = '600';
    }

    ellipsisContainer.style.textOverflow = 'clip';
    ellipsisContainer.style.webkitLineClamp = 'none';

    ellipsisContainer.innerHTML = '';

    const inRange = () => {
        // content may not wrap (line break strategy), so a single row is also judged by width
        const widthInRange = ellipsisContainer.scrollWidth <= ellipsisContainer.offsetWidth;
        const heightInRange = ellipsisContainer.scrollHeight < maxHeight;

        return rows === 1 ? widthInRange && heightInRange : heightInRange;
    };

    const ellipsisContentHolder = document.createElement('span');
    const textNode = document.createTextNode(content);
    ellipsisContentHolder.appendChild(textNode);
    if (suffix.length > 0) {
        const ellipsisTextNode = document.createTextNode(suffix);
        ellipsisContentHolder.appendChild(ellipsisTextNode);
    }
    ellipsisContainer.appendChild(ellipsisContentHolder);

    if (fixedContent.copy) {
        ellipsisContainer.appendChild(fixedContent.copy.cloneNode(true));
    }

    const appendExpandNode = () => {
        ellipsisContainer.innerHTML = '';
        ellipsisContainer.appendChild(ellipsisContentHolder);
        Object.values(fixedContent).map((node) => node && ellipsisContainer.appendChild(node.cloneNode(true)));
    };

    const getCurrentText = (text: string, pos: number) => {
        const end = text.length;
        if (!pos) {
            return ellipsisStr;
        }
        if (ellipsisPos === 'end') {
            return text.slice(0, pos) + ellipsisStr;
        }
        return text.slice(0, pos) + ellipsisStr + text.slice(end - pos, end);
    };

    const measureText = (textNode: Text, fullText: string, startLoc = 0, endLoc = fullText.length) => {
        const midLoc = Math.floor((startLoc + endLoc) / 2);
        const currentText = getCurrentText(fullText, midLoc);
        textNode.textContent = currentText;
        if (startLoc >= endLoc - 1 && endLoc > 0) {
            for (let step = endLoc; step >= startLoc; step -= 1) {
                const currentStepText = getCurrentText(fullText, step);
                textNode.textContent = currentStepText;
                if (inRange()) {
                    return currentStepText;
                }
            }
        } else if (endLoc === 0) {
            return ellipsisStr;
        }

        if (inRange()) {
            return measureText(textNode, fullText, midLoc, endLoc);
        }
        return measureText(textNode, fullText, startLoc, midLoc);
    };

    let resText = content;
    if (!inRange()) {
        appendExpandNode();
        resText = measureText(textNode, content, 0, ellipsisPos === 'middle' ? Math.floor(content.length / 2) : content.length);
    }
    ellipsisContainer.innerHTML = '';
    return resText;
}

function isSingleRowOverflowing(containerNode: HTMLElement) {
    // clientWidth is rounded to an integer while Range rects are exact floats, so comparing them reports false
    // overflow on sub-pixel text (32.3 > 32); use the same-precision rect minus padding and border (content box)
    const containerRectWidth = containerNode.getBoundingClientRect().width;
    const computedStyle = window.getComputedStyle(containerNode);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
    const contentAreaWidth = Math.max(0, containerRectWidth - paddingLeft - paddingRight - borderLeft - borderRight);

    const range = document.createRange();
    const contentWidth = Array.from(containerNode.childNodes).reduce((acc: number, node: Node) => {
        range.selectNodeContents(node);
        return acc + range.getBoundingClientRect().width;
    }, 0);
    return contentWidth > contentAreaWidth;
}

/** Whether the text overflows: in width for a single row, in height for several rows */
export function isOverflowing(node: HTMLElement, rows: number) {
    if (!rows || rows < 1) {
        return false;
    }
    return rows <= 1 ? isSingleRowOverflowing(node) : node.scrollHeight > node.offsetHeight;
}

/**
 * The pending measurement frame, and the gate for ResizeObserver reports. The observer reports every newly
 * observed element straight away, which the mount measurement already covers, so its reports count from one tick
 * after the first frame.
 */
export class EllipsisRuntime {
    #frame = 0;
    #gateFrame = 0;
    #gateTimer: ReturnType<typeof setTimeout> | undefined;
    #observing = false;
    #measure: () => void = () => undefined;

    connect(measure: () => void) {
        this.#measure = measure;
        this.#gateFrame = requestAnimationFrame(() => {
            this.#gateTimer = setTimeout(() => {
                this.#observing = true;
            });
        });
    }

    disconnect() {
        cancelAnimationFrame(this.#frame);
        cancelAnimationFrame(this.#gateFrame);
        clearTimeout(this.#gateTimer);
        this.#observing = false;
    }

    schedule() {
        cancelAnimationFrame(this.#frame);
        this.#frame = requestAnimationFrame(() => this.#measure());
    }

    handleResize() {
        if (this.#observing) {
            this.schedule();
        }
    }
}
