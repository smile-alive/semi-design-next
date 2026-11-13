import { focusables, isEditable, isUnreachable, withRole } from './aria';
import { checkNavigation, checkTabStop, type Composite, enter } from './composite';
import { arrowsFor, type Context, findWidget, missing, orientationOf, requireName } from './context';

export async function toolbar(ctx: Context) {
    const bar = findWidget(ctx, ['toolbar']);
    if (!bar) {
        return missing(ctx, 'toolbar', 'toolbar');
    }
    // A toolbar needs a name once the page has more than one
    if (withRole(ctx.doc.body, ['toolbar']).length > 1) {
        requireName(ctx, bar, 'toolbar');
    }
    const composite: Composite = { container: bar, items: () => focusables(bar).filter((el) => !isUnreachable(el)), noun: '控件', source: 'toolbar' };
    const arrows = arrowsFor(orientationOf(ctx, bar), ctx.options.direction);
    checkTabStop(ctx, composite);
    const items = composite.items();
    // Arrows edit text inside a text field, so a toolbar holding one cannot be walked with them
    if (items.length < 2 || items.some(isEditable)) {
        return;
    }
    enter(ctx, composite);
    await checkNavigation(ctx, composite, { next: [arrows.next], previous: [arrows.previous], wraps: ctx.wraps('optional'), homeEnd: true });
}
