import { LoopDecision } from "@mixeditor/common";
import { MECompoBehaviorMap } from "@mixeditor/core";
import { DocConfigCompo } from "../../compo/base/doc_config";
import { DocInsertCb } from "./cb";
import { InsertDecision, InsertDecisionReject, InsertMethod } from "./executor";

export const handle_two_direction_scan_ent_for_insert: MECompoBehaviorMap[typeof DocInsertCb] =
  async (params) => {
    const { items } = params;
    if (items.length === 0) {
      return InsertDecisionReject;
    }

    const doc_config = params.ex_ctx.ecs.get_compo(
      params.ent_id,
      DocConfigCompo.type
    );
    if (!doc_config || !doc_config.get_insert_method) {
      return InsertDecisionReject;
    }

    const insert_methods: InsertMethod[] = [];

    const filter_state = {};
    for (let front_index = 0; front_index < items.length; front_index++) {
      const item = items[front_index];
      const insert_method = await doc_config.get_insert_method({
        curr_ent_id: item,
        editor: params.ex_ctx,
        ent_id: params.ent_id,
        state: filter_state,
      });
      if (insert_method === LoopDecision.Break) {
        return InsertDecision.Reject();
      } else {
        insert_methods.push(insert_method);
      }
    }

    return InsertDecision.Accept({ methods: insert_methods });
  };
