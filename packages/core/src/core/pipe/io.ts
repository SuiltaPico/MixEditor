export interface MEPackV1 {
  _ver: 1;
  tdos: [id: string, type: string, compos: [type: string, data: any][]][];
  blob: [type: string, data: Blob][];
  entries: string[];
}

export type MEPack = MEPackV1;
