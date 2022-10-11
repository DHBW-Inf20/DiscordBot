import { Kantine } from "./commands/Kantine";
import { Stundenplan } from "./commands/Stundenplan";
import { Command, ContextMenuCommand } from './types/command';
import { Zitat } from './commands/Zitat';
import { Neske } from './commands/Neske';

// Register Commands of the bot
export const Commands: (Command | ContextMenuCommand)[] = [Stundenplan, Kantine, Zitat, Neske];