import { Command } from "./Command";

export class HistoryManager {
  history_stack: Command[] = [];

  async execute(command: Command) {
    await command.execute();
  }

  async undo(command: Command) {
    await command.undo();
  }
}
