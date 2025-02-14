import { SelectedData } from "../../selection";
import { Operation } from "../Operation";

export interface DeleteRangeOperation extends Operation {
  data: {
    start: SelectedData;
    end: SelectedData;
    start_path: string[];
    end_path: string[];
  };
}

// export function create_DeleteRangeOperation(
//   id: string,
//   start: SelectedData,
//   end: SelectedData
// ) {
//   return {
//     id,
//     type: "delete_range" as const,
//     data: {
//       start,
//       end,
//     },
//   } satisfies DeleteRangeOperation;
// }
