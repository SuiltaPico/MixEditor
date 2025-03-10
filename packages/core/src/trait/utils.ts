import { MarkTDOCtx, MarkTDORecord } from "./tdo";
import { MarkCtx } from "./mark_ctx";
import { MarkRecord } from "./mark";

/** 保存标记表为标记TDO表。 */
export async function save_mark_record(
  mark_manager: MarkCtx<any, any, any>,
  mark_record?: MarkRecord
) {
  const result: MarkTDORecord = {};
  if (!mark_record) return result;

  for (const [key, mark] of mark_record.entries()) {
    result[key] = await mark_manager.exec_behavior(mark, "to_tdo", {})!;
  }
  return result;
}

/** 加载标记TDO表为标记表。 */
export async function load_mark_record(
  mark_tdo_manager: MarkTDOCtx<any, any, any>,
  tdo_record?: MarkTDORecord
) {
  const result: MarkRecord = new Map();
  if (!tdo_record) return result;

  for (const [key, tdo] of Object.entries(tdo_record)) {
    result.set(key, await mark_tdo_manager.exec_behavior(tdo, "to_mark", {})!);
  }
  return result;
}
