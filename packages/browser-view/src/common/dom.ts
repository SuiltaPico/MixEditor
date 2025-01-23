export function get_caret_pos_from_point(x: number, y: number) {
  let range;
  let node;
  let offset;

  // @ts-ignore
  if (document.caretPositionFromPoint) {
    // @ts-ignore
    range = document.caretPositionFromPoint(x, y);
    if (!range) return;
    node = range.offsetNode;
    offset = range.offset;
  } else if (document.caretRangeFromPoint) {
    // Use WebKit-proprietary fallback method
    range = document.caretRangeFromPoint(x, y);
    if (!range) return;
    node = range.startContainer;
    offset = range.startOffset;
  } else {
    // Neither method is supported, do nothing
    return;
  }
  return {
    textNode: node,
    offset,
  };
}
