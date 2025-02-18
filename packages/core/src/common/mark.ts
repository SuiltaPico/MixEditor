import { MarkMap, MarkTDOMap } from "../node/mark";
import { MarkManager } from "../node/mark_manager";
import { TDOManager } from "../node/tdo_manager";

export async function save_mark_map(
  mark_manager: MarkManager,
  mark_map: MarkMap
) {
  const result: MarkTDOMap = {};
  for (const [key, value] of Object.entries(mark_map)) {
    result[key] = await mark_manager.execute_handler("save", value);
  }
  return result;
}

export async function load_mark_map(
  tdo_manager: TDOManager,
  mark_map: MarkTDOMap
) {
  const result: MarkMap = {};
  for (const [key, value] of Object.entries(mark_map)) {
    result[key] = await tdo_manager.execute_handler("load", value);
  }
  return result;
}
