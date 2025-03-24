import {
  get_ent_path,
  MECompoBehaviorMap,
  reverse_walk,
  walk,
  WalkDone,
} from "@mixeditor/core";
import { DocConfigCompo } from "../../compo/base/doc_config";
import { DocInsertCb } from "./cb";
import { InsertDecision, InsertDecisionNoneAccepted } from "./executor";

export const handle_two_direction_scan_ent_for_insert: MECompoBehaviorMap[typeof DocInsertCb] =
  async (params) => {
    const { ent_id, items } = params;
    if (items.length === 0) {
      return InsertDecisionNoneAccepted;
    }

    const doc_config = params.ex_ctx.ecs.get_compo(
      params.ent_id,
      DocConfigCompo.type
    );
    if (!doc_config || !doc_config.insert_filter) {
      return InsertDecisionNoneAccepted;
    }

    let front_stop_ent_id, back_stop_ent_id;

    const walk_state = {};
    let front_index = 0;
    for (; front_index < items.length; front_index++) {
      front_stop_ent_id = walk(
        params.ex_ctx.ecs,
        items[front_index],
        (ent_id) => {
          return doc_config.insert_filter!({
            curr_ent_id: ent_id,
            editor: params.ex_ctx,
            ent_id: params.ent_id,
            state: walk_state,
            direction: "forward",
          });
        }
      );
      if (front_stop_ent_id !== WalkDone) {
        break;
      }
      if (front_index === items.length - 1 && front_stop_ent_id === WalkDone) {
        return InsertDecision.Accept();
      }
    }

    let back_index = items.length - 1;
    for (; back_index >= 0; back_index--) {
      back_stop_ent_id = reverse_walk(
        params.ex_ctx.ecs,
        items[back_index],
        (ent_id) => {
          return doc_config.insert_filter!({
            curr_ent_id: ent_id,
            editor: params.ex_ctx,
            ent_id: params.ent_id,
            state: walk_state,
            direction: "backward",
          });
        }
      );
      if (back_stop_ent_id !== WalkDone) {
        break;
      }
      if (back_index === 0 && back_stop_ent_id === WalkDone) {
        return InsertDecision.Accept();
      }
    }

    const front_path = [
      front_index,
      ...get_ent_path(params.ex_ctx.ecs, front_stop_ent_id as string),
    ];
    const back_path = [
      back_index,
      ...get_ent_path(params.ex_ctx.ecs, back_stop_ent_id as string),
    ];

    return InsertDecision.PartialAccept({
      rejected_from: front_path,
      rejected_to: back_path,
    });
  };
