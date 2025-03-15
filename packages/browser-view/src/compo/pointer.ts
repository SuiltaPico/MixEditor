import { Compo } from "@mixeditor/core";

export class HandlePointerDownCompo implements Compo {
  static readonly type = "bv:handle_pointer_down";
  get type() {
    return HandlePointerDownCompo.type;
  }

  constructor(public handler: (event: PointerEvent) => void) {}
}

export class HandlePointerUpCompo implements Compo {
  static readonly type = "bv:handle_pointer_up";
  get type() {
    return HandlePointerUpCompo.type;
  }

  constructor(public handler: (event: PointerEvent) => void) {}
}

export class HandlePointerMoveCompo implements Compo {
  static readonly type = "bv:handle_pointer_move";
  get type() {
    return HandlePointerMoveCompo.type;
  }

  constructor(public handler: (event: PointerEvent) => void) {}
}

export class HandlePointerEnterCompo implements Compo {
  static readonly type = "bv:handle_pointer_enter";
  get type() {
    return HandlePointerEnterCompo.type;
  }

  constructor(public handler: (event: PointerEvent) => void) {}
}

// export class HandlePointerLeaveCompo implements Compo {
//   static readonly type = "bv:handle_pointer_leave";
//   get type() {
//     return HandlePointerLeaveCompo.type;
//   }

//   constructor(public handler: (event: PointerEvent) => void) {}
// }

// export class HandlePointerOverCompo implements Compo {
//   static readonly type = "bv:handle_pointer_over";
//   get type() {
//     return HandlePointerOverCompo.type;
//   }

//   constructor(public handler: (event: PointerEvent) => void) {}
// }

// export class HandlePointerOutCompo implements Compo {
//   static readonly type = "bv:handle_pointer_out";
//   get type() {
//     return HandlePointerOutCompo.type;
//   }

//   constructor(public handler: (event: PointerEvent) => void) {}
// }

// export class HandlePointerCancelCompo implements Compo {
//   static readonly type = "bv:handle_pointer_cancel";
//   get type() {
//     return HandlePointerCancelCompo.type;
//   }

//   constructor(public handler: (event: PointerEvent) => void) {}
// }

// export class HandleGotPointerCaptureCompo implements Compo {
//   static readonly type = "bv:handle_pointer_cancel";
//   get type() {
//     return HandlePointerCancelCompo.type;
//   }

//   constructor(public handler: (event: PointerEvent) => void) {}
// }


// export class HandleLostPointerCaptureCompo implements Compo {
//   static readonly type = "bv:handle_pointer_cancel";
//   get type() {
//     return HandlePointerCancelCompo.type;
//   }

//   constructor(public handler: (event: PointerEvent) => void) {}
// }
