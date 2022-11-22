import { Kantine } from "./commands/Kantine";
import { Stundenplan } from "./commands/Stundenplan";
import { Command, ContextMenuCommand } from './types/command';
import { Zitat } from './commands/Zitat';
import { Verify } from './commands/Verify';
import { Essen } from './commands/Essen';

// Register Commands of the bot
export const Commands: (Command | ContextMenuCommand)[] = [Stundenplan, Kantine, Zitat, Verify];