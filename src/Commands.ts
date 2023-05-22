import { Kantine } from "./commands/Kantine";
import { Stundenplan } from "./commands/Stundenplan";
import { Command, ContextMenuCommand } from './types/command';
import { Zitat } from './commands/Zitat';
import { Verify } from './commands/Verify';
import { Essen } from './commands/Essen';1
import { Caesar } from "./commands/Caesar"; 
import { LiveTicker } from './commands/Liveticker';
import { Dalle } from './commands/Dalle';
import { Ask } from "./commands/Ask";
import { Wetter, GrillWetter } from './commands/Wetter';
import { RemindMe } from "./commands/RemindMe";
import { AddPrompt, ListPrompts, Session, SetPrompt, ShowPrompt } from "./commands/Session";
import { Umfrage } from "./commands/Umfrage";
import { EndBracket, NextBracket } from "./commands/BestOfZitate";
import { FinalZitate } from "./commands/ZitatFinal";

// Register Commands of the bot
export const Commands: (Command | ContextMenuCommand)[] = [Stundenplan, Kantine, Zitat, Verify, Caesar, LiveTicker, Ask, Wetter, GrillWetter, RemindMe, Session, SetPrompt, AddPrompt, ListPrompts, ShowPrompt, Umfrage, NextBracket, EndBracket, FinalZitate];
