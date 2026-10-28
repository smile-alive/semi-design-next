import { createContext } from '../_base/create-context';

// A trigger that opts out of aria-describedby (an explicit undefined) because the element the popup describes sits
// inside it (Typography's ellipsis text) reads the popup id here; undefined while the popup is not in the document.
export const [TooltipDescriptionContext, useTooltipDescription] = createContext<string>('TooltipDescription', { optional: true });
