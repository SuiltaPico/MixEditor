import { MarkManager } from "../../../entity/mark/manager";
import { MarkMap } from "../../../entity/mark/mark";
import {
  MarkTDOHandlerManager,
  MarkTDOMap,
} from "../../../entity/mark/mark_tdo";

/** 保存标记表为标记TDO表。 */
export async function save_mark_map(
  mark_manager: MarkManager,
  mark_map?: MarkMap
) {
  const result: MarkTDOMap = {};
  if (!mark_map) return result;

  for (const [key, value] of Object.entries(mark_map)) {
    result[key] = await mark_manager.execute_handler("to_tdo", value);
  }
  return result;
}

/** 加载标记TDO表为标记表。 */
export async function load_mark_map(
  mark_tdo_manager: MarkTDOHandlerManager,
  mark_tdo_map?: MarkTDOMap
) {
  const result: MarkMap = {};
  if (!mark_tdo_map) return result;

  for (const [key, value] of Object.entries(mark_tdo_map)) {
    result[key] = await mark_tdo_manager.execute_handler("to_mark", value)!;
  }
  return result;
}

/** 判断两个标记列表是否相同。 */
export function mark_map_is_equal(
  mark_manager: MarkManager,
  map1: MarkTDOMap | MarkMap,
  map2: MarkTDOMap | MarkMap
) {
  if (Object.keys(map1).length !== Object.keys(map2).length) return false;

  for (const mark_id in map1) {
    const mark1 = map1[mark_id];
    const mark2 = map2[mark_id];
    if (!mark_manager.execute_handler("is_equal", mark1, mark2)) return false;
  }

  return true;
}
