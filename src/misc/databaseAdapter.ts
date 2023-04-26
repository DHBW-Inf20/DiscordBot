import mongoose from 'mongoose';
import { Client, Collection, Message, TextChannel } from 'discord.js';


interface DBA {
    initDB(): Promise<void>;
}

export interface IUser {
    dhusername: string,
    discordId: string,
    roles: string[],
    course: string,
}

export interface IBracket {
    id: number,
    order_id: number,
    name: string,
    from: Date,
    to: Date,
    zitate: IZitatWahl[],
    winner: IZitatWahl | null,
    voters: { voter: IUser, zitat: IZitatWahl }[],
    next_id: number,
}


export interface IDavinciData {
    personality_description: string,
    temperature: number,
    max_tokens: number,
    top_p: number,
    weight: number
}

export interface IChatPrompt {
    prompt: string,
    selected: boolean
}

export interface IUserBasedPrompt {
    prompt: INameBasedPrompt,
    user_id: string
}

export interface INameBasedPrompt {
    prompt: string,
    name: string
}

export interface IZitatWahl {
    id: number,
    zitat: IZitat,
    votes: number,
    order_id: number,
}

export interface IZitat {
    discordId: string,
    zitat: string,
    image: string,
    reference: IZitat | null,
    author: string,
    weird: boolean,
    contextLink: string,
    timestamp: Date
}

class DatabaseAdapter implements DBA {


    async getZitat(referencedID: string): Promise<IZitat | null> {
        return this.zitatModel.findOne({ discordId: referencedID });
    }


    zitatWahlModel: mongoose.Model<IZitatWahl>;
    userModel: mongoose.Model<IUser>;
    zitatModel: mongoose.Model<IZitat>;
    davinciDataModel: mongoose.Model<IDavinciData>;
    chatPromptModel: mongoose.Model<IChatPrompt>;
    userBasedPromptModel: mongoose.Model<IUserBasedPrompt>;
    nameBasedPromptModel: mongoose.Model<INameBasedPrompt>;



    bracketModel: mongoose.Model<IBracket>;
    constructor(host: string, user: string, password: string, dbname: string) {
        mongoose.connect(`mongodb+srv://${user}:${password}@${host}/${dbname}?retryWrites=true&w=majority`);

        const DavinciDataSchema = new mongoose.Schema<IDavinciData>({
            personality_description: String,
            temperature: Number,
            max_tokens: Number,
            top_p: Number,
            weight: Number
        });

        const ZitatWahlSchema = new mongoose.Schema<IZitatWahl>({
            id: Number,
            zitat: { type: mongoose.Schema.Types.ObjectId, ref: 'Zitat' },
            votes: Number,
            order_id: Number
        });

        const UserSchema = new mongoose.Schema<IUser>({
            dhusername: String,
            discordId: String,
            roles: [String],
            course: String,
        });

        const ZitatSchema = new mongoose.Schema<IZitat>({
            discordId: String,
            zitat: String,
            weird: Boolean,
            image: String,
            author: String,
            contextLink: String,
            reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Zitat' },
            timestamp: Date
        });

        const ChatPromptSchema = new mongoose.Schema<IChatPrompt>({
            prompt: String,
            selected: Boolean
        });

        const UserBasedPromptSchema = new mongoose.Schema<IUserBasedPrompt>({
            prompt: { type: mongoose.Schema.Types.ObjectId, ref: 'NameBasedPrompt' },
            user_id: String
        });

        const NameBasedPromptSchema = new mongoose.Schema<INameBasedPrompt>({
            prompt: String,
            name: String
        });

        const BracketSchema = new mongoose.Schema<IBracket>({
            id: Number,
            order_id: Number,
            name: String,
            from: Date,
            to: Date,
            zitate: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ZitatWahl' }],
            voters: [{ voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, zitat: { type: mongoose.Schema.Types.ObjectId, ref: 'ZitatWahl' } }],
            winner: { type: mongoose.Schema.Types.ObjectId, ref: 'ZitatWahl' },
            next_id: Number
        });

        this.zitatWahlModel = mongoose.model<IZitatWahl>('ZitatWahl', ZitatWahlSchema);

        this.bracketModel = mongoose.model<IBracket>('Bracket', BracketSchema);
        this.nameBasedPromptModel = mongoose.model<INameBasedPrompt>('NameBasedPrompt', NameBasedPromptSchema);
        this.userBasedPromptModel = mongoose.model<IUserBasedPrompt>('UserBasedPrompt', UserBasedPromptSchema);
        this.chatPromptModel = mongoose.model<IChatPrompt>('ChatPrompt', ChatPromptSchema);
        this.userModel = mongoose.model<IUser>('User', UserSchema);
        this.zitatModel = mongoose.model<IZitat>('Zitat', ZitatSchema);
        this.davinciDataModel = mongoose.model<IDavinciData>('DavinciData', DavinciDataSchema);
    }
    initDB(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async isBracketInited() {
        const bracket = await this.bracketModel.findOne({ id: 1 });
        if (bracket === null) return false;
        else return true;
    }

    async getBracket(id: number, order_id: number) {
        const bracket = await this.bracketModel.findOne({ id: id, order_id: order_id }).populate({
            path: 'zitate',
            populate: {
                path: 'zitat',
            }
        }).populate('voters.voter').populate('voters.zitat').populate('winner');
        if (bracket === null) return null;
        else return bracket;
    }

    async getAllBracketZitate(id: number, order_id: number) {
        const bracket = await this.bracketModel.findOne({ id: id, order_id: order_id }).populate('zitate');
        if (bracket === null) return null;
        else return bracket.zitate;
    }

    async getSemesterWeekRange(id: number): Promise<[number, number]> {

        const months = await this.bracketModel.find({ next_id: id - 2, order_id: 1 });

        if (months.length === 0) return [-1, -1];
        let range: [number, number] = [Infinity, -1];
        await Promise.all(months.map(async (month) => {

            const weeks = await this.bracketModel.find({ next_id: month.id, order_id: 0 }).sort({ id: 1 });

            if (weeks.length !== 0) {
                const from = weeks[0].id;
                const to = weeks[weeks.length - 1].id;
                if (from < range[0]) range[0] = from;
                if (to > range[1]) range[1] = to;
            }
        }));
        return range;

    }

    async getNextSemesterBracket(semesterId: number) {
        const range = await this.getSemesterWeekRange(semesterId);
        for (let week = range[0]; week <= range[1]; week++) {
            const bracket = await this.bracketModel.findOne({ id: week, order_id: 0 }).populate({
                path: 'zitate',
                populate: {
                    path: 'zitat',
                },
            }).populate('voters.voter').populate('voters.zitat').populate('winner');




            if (bracket === null) return null;
            console.log("🚀 ~ file: databaseAdapter.ts:224 ~ DatabaseAdapter ~ getNextSemesterBracket ~ bracket:", bracket)



            if (bracket.winner === null && bracket.zitate.length !== 0) {
                return bracket;
            }
        }
        return null;
    }

    async syncZitate() {

        let zitate = await this.zitatModel.find();
        let zitatWahlArray: IZitatWahl[] = []
        let maxId = (await this.zitatWahlModel.findOne({ order_id: 0 }).sort({ id: -1 }))?.id ?? 0;
        zitate.forEach(async (zitat, index) => {

            let found = (await this.zitatWahlModel.findOne({ zitat: zitat._id, order_id: 0 })) !== null;
            if (found) return;

            let zitatWahl = new this.zitatWahlModel({
                id: maxId,
                votes: 0,
                zitat: zitat,
                order_id: 0,
            });
            maxId++;
            const bracket = await this.bracketModel.findOne({ from: { $lte: zitat.timestamp }, to: { $gte: zitat.timestamp }, order_id: 0 });
            if (bracket === null) return;
            await zitatWahl.save();
            bracket.zitate.push(zitatWahl);
            await bracket.save();
            // Get matching bracket based on the date

        });
    }

    async finishBracket(id: number, order_id: number) {
        const bracket = await this.getBracket(id, order_id);
        if (bracket === null) {
            throw Error("Bracket not found");
        }
        if (bracket.winner) {
            throw Error("Bracket already finished");
        }
        bracket.zitate.sort((a, b) => b.votes - a.votes);
        bracket.winner = bracket.zitate[0];
        await bracket.save();
        return bracket;

    }

    async voteZitatFromBracket(id: number, order_id: number, voterId: string, zitatId: number) {

        const bracket = await this.getBracket(id, order_id);
        if (bracket === null) {
            throw Error("Bracket not found");
        }
        if (bracket.winner) {
            throw Error("Bracket already finished");
        }
        if (bracket.voters.find(voter => voter.voter.discordId === voterId)) {
            // IF the id from zitat is the same throw error
            if (bracket.voters.find(voter => voter.voter.discordId === voterId)?.zitat.id === zitatId) {
                throw Error("Already voted for this zitat");
            } else {
                // Change the vote to the current zitat
                const voterIndex = bracket.voters.findIndex(voter => voter.voter.discordId === voterId);
                if (voterIndex === -1) throw Error("Voter not found");
                const zitatWahl = await this.zitatWahlModel.findOne({ id: zitatId, order_id: order_id });
                if (zitatWahl === null) throw Error("Zitat not found");
                const oldZitatWahl = await this.zitatWahlModel.findOne({ id: bracket.voters[voterIndex].zitat.id, order_id: order_id });
                if (oldZitatWahl === null) throw Error("old Zitat not found");
                oldZitatWahl.votes--;
                await oldZitatWahl.save();

                zitatWahl.votes++;
                await zitatWahl.save();
                bracket.voters[voterIndex].zitat = zitatWahl;
                await bracket.save();
                return;
            }
        } else {
            // Add new vote
            const voter = await this.userModel.findOne({ discordId: voterId });
            if (voter === null) throw Error("Voter not found");
            const zitatWahl = await this.zitatWahlModel.findOne({ id: zitatId, order_id: order_id });
            if (zitatWahl === null) throw Error("Zitat not found");
            zitatWahl.votes++;
            await zitatWahl.save();
            bracket.voters.push({ voter: voter, zitat: zitatWahl });
            await bracket.save();
            return;
        }

    }

    async getUserBasedPrompt(discordId: string): Promise<String | null> {
        const prompt = await this.userBasedPromptModel.findOne({ user_id: discordId }).populate('prompt');
        if (prompt === null) {
            await this.initUserBasedPrompt(discordId);
            return this.getUserBasedPrompt(discordId);
        }
        if (prompt.prompt === null) return null;
        else return prompt.prompt.prompt;
    }

    async getFirstTimeStamp(): Promise<Date | null> {
        const zitat = await this.zitatModel.findOne().sort({ timestamp: 1 });
        if (zitat === null) return null;
        else return zitat.timestamp;
    }

    async aggregateDuplicateZitate() {

        var duplicates = await this.zitatModel.aggregate([
            {
                $match: { zitat: { $ne: "" } }
            }
            , {
                $group: {
                    _id: { discordId: "$discordId", zitat: "$zitat" },
                    dups: { $addToSet: "$_id" },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);


        console.log((duplicates).length)

        for (var i = 0; i < duplicates.length; i++) {
            for (var j = 1; j < duplicates[i].dups.length; j++) {
                await this.zitatModel.findByIdAndRemove(duplicates[i].dups[j]);
            }
        }

    }

    async initFirstBrackets() {
        // Init all Brackets for the time (weekly)
        const time_ranges = [
            [1619397600, 1621743600], // 26.04. – 23.05.2021 Theoriephase
            [1622440800, 1627206000], // 31.05. – 25.07.2021 Theoriephase
            [1633330800, 1640521200], // 04.10. – 26.12.2021 Theoriephase
            [1647327600, 1654402800], // 14.03. – 05.06.2022 Theoriephase
            [1664818800, 1672028400], // 03.10. – 25.12.2022 Theoriephase
            [1678057200, 1685224800]  // 06.03. – 28.05.2023 Theoriephase
        ];

        let id = 0;
        let weeks = 0;
        for (let time_range of time_ranges) {

            const [from, to] = time_range.map(x => new Date(x * 1000));

            console.log("Next Week, ", from.toLocaleDateString(), to.toLocaleString(), "Weeks: ", weeks);
            // This interval is not a week but can be a month or more, so we need to calculate the number of weeks and iiterate through it

            for (let timeOffset = 0; timeOffset < (to.getTime() - from.getTime()); timeOffset += 24 * 7 * 60 * 60 * 1000) {
                let weekDate = new Date(from.getTime() + timeOffset);
                let weekEnd = new Date(weekDate.getTime() + 24 * 7 * 60 * 60 * 1000);
                weeks++;
                console.log(weeks, weekDate.toLocaleDateString(), to.toLocaleDateString());
                const center_time = new Date((from.getTime() + to.getTime()) / 2);



                const bracket = new this.bracketModel({
                    id: id,
                    order_id: 0,
                    name: `Woche ${id + 1} - ${from.toLocaleDateString()} bis ${to.toLocaleDateString()}`,
                    from: weekDate,
                    to: weekEnd,
                    zitate: [],
                    voters: [],
                    winner: null,
                    next_id: await this.getMonthId(center_time)
                });
                bracket.save();
                id++;
            }
        }
    }

    async getMonthId(date: Date): Promise<number> {

        // Get the id from the bracket-Model where the date is in the range
        let bracket = await this.bracketModel.find({ order_id: 1, from: { $lte: date }, to: { $gte: date } });
        if (bracket.length === 0) return -1;
        else return bracket[0].id;

    }

    async getSemesterId(date: Date): Promise<number> {
        let bracket = await this.bracketModel.find({ order_id: 2, from: { $lte: date }, to: { $gte: date } });
        if (bracket.length === 0) return -1;
        else return bracket[0].id;
    }

    async getYearId(date: Date): Promise<number> {
        let bracket = await this.bracketModel.find({ order_id: 3, from: { $lte: date }, to: { $gte: date } });
        if (bracket.length === 0) return -1;
        else return bracket[0].id;
    }

    async initThirdBrackets() {
        const time_ranges = [
            [1617235200, 1625097599], // 2. Semester
            [1633046400, 1640908799], // 3. Semester
            [1646064000, 1653926399], // 4. Semester
            [1664553600, 1672415999], // 5. Semester
            [1677091200, 1684867199], // 6. Semester
        ]

        let id = 0;
        for (let time_range of time_ranges) {

            console.log("Next Semester, ", id, " ", time_range);
            const [from, to] = time_range.map(x => new Date(x * 1000));
            const center_time = new Date((from.getTime() + to.getTime()) / 2);

            const bracket = new this.bracketModel({
                id: id,
                order_id: 2,
                name: `Semester ${id + 2} - ${from.toLocaleDateString()} bis ${to.toLocaleDateString()}`,
                from: from,
                to: to,
                zitate: [],
                voters: [],
                winner: null,
                next_id: await this.getYearId(center_time)
            });
            bracket.save();

            id++;

        }

    }

    async initLastBracket() {

        const bracket = new this.bracketModel({
            id: 0,
            order_id: 4,
            name: `Finale`,
            from: new Date(1617235200),
            to: new Date(1684867199),
            zitate: [],
            voters: [],
            winner: null,
            next_id: -1
        });
        bracket.save();
    }

    async initFourthBrackets() {
        const time_ranges = [
            [1617235200, 1625097599], // 1. Jahr
            [1633046400, 1653926399], // 2. Jahr
            [1664553600, 1684867199], // 3. Jahr
        ]

        let id = 0;
        for (let time_range of time_ranges) {
            console.log("Next Year, ", id, " ", time_range);
            const [from, to] = time_range.map(x => new Date(x * 1000));

            const bracket = new this.bracketModel({
                id: id,
                order_id: 3,
                name: `Jahr ${id + 1} - ${from.toLocaleDateString()} bis ${to.toLocaleDateString()}`,
                from: from,
                to: to,
                zitate: [],
                voters: [],
                winner: null,
                next_id: 0,
            });
            bracket.save();
            id++;
        }


    }

    async initSecondBrackets() {
        // Monthly Brackets
        const time_ranges = [
            [1617235200, 1625097599], // April 2021 - Juli 2021
            [1633046400, 1640908799], // Oktober 2021 - Dezember 2021
            [1646064000, 1653926399], // März 2022 - Juni 2022
            [1664553600, 1672415999], // Oktober 2022 - Dezember 2022
            [1677091200, 1684867199], // März 2023 - Mai 2023
        ]

        let id = 0;
        for (let time_range of time_ranges) {

            const [from, to] = time_range.map(x => new Date(x * 1000));

            // This interval is not a week but can be a month or more, so we need to calculate the number of weeks and iiterate through it
            let nextMonth;
            for (let currentMonth = from; currentMonth <= to; currentMonth = nextMonth) {
                if (currentMonth.getMonth() === 11) {
                    nextMonth = new Date(currentMonth.getFullYear() + 1, 0, 1);
                } else {
                    nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                }
                console.log("Next Month, ", currentMonth.toLocaleDateString(), nextMonth.toLocaleDateString());


                const bracket = new this.bracketModel({
                    id: id,
                    order_id: 1,
                    name: `Monat ${id + 1} - ${currentMonth.toLocaleDateString()} bis ${nextMonth.toLocaleDateString()}`,
                    from: currentMonth,
                    to: nextMonth,
                    zitate: [],
                    voters: [],
                    winner: null,
                    next_id: await this.getSemesterId(currentMonth)
                });
                await bracket.save();

                id++;

            }



        }
    }

    async syncZitateBeforeDataTime(client: Client) {
        // wait for client to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        const guild = client.guilds.cache.get("772760465390043148");
        if (guild === undefined) throw new Error("Guild not found");
        const zitateChannel = guild.channels.cache.get("849242671821619230") as TextChannel;
        if (zitateChannel === undefined) throw new Error("Channel not found");
        const firstTimeStamp = await this.getFirstTimeStamp();
        if (firstTimeStamp === null) throw new Error("No zitate found");
        // Get all messages from the channel
        console.log("Fetching messages...");
        let lastTimeStamp = undefined;
        let isDone = false;
        do {
            // Get date in this format '%b %d %Y %I:%M%p'
            const messages = await zitateChannel.messages.fetch({
                limit: 100
                , before: lastTimeStamp
            }) as Collection<string, Message>;
            console.log("Fetched messages n:" + messages.size);
            let i = 0;
            messages.forEach(async (message) => {
                console.log(message.author);

                if (i % 10 === 0) console.log(`Syncing message ${i} of ${messages.size}`);
                // Go through every message one by one and add it to the database
                // Check if the message is already in db, (is a embed in the message)
                i++;
                if (message.embeds.length !== 0) return;
                // check if the message is already in db
                const zitat = await this.zitatModel.findOne({ discordId: message.id });
                let messageImage = message.attachments.first();
                let messageText = message.content;
                if (messageText === "") {
                    if (messageImage === undefined) return;
                    messageText = "<no text>";
                }
                let messageSplit = messageText.split("-");

                let author = "unknown"
                let zitatText = messageText;
                if (messageSplit.length >= 2) {
                    author = messageSplit[messageSplit.length - 1].trim();
                    zitatText = messageSplit.slice(0, messageSplit.length - 1).join("-").trim();
                    // Replace the quotes if there are any at the start or beginning
                    if (zitatText.startsWith("\"") && zitatText.endsWith("\"")) zitatText = zitatText.slice(1, zitatText.length - 1);
                }

                if (zitat !== null) {
                    zitat.zitat = zitatText;
                    zitat.weird = true;
                    if (messageImage !== undefined) {
                        zitat.image = messageImage?.url;
                    }
                    zitat.author = author;
                } else {

                    this.zitatModel.create({
                        discordId: message.id,
                        zitat: zitatText,
                        weird: false,
                        image: messageImage?.url,
                        author: author,
                        contextLink: message.url,
                        reference: null,
                        timestamp: message.createdAt
                    });
                }

                lastTimeStamp = message.id;
            });
            isDone = messages.size < 100;
        } while (!isDone)

    }

    async syncTimeStampForZitat(client: Client) {
        // Go through every Zitat in the database one by one
        const zitate = await this.zitatModel.find();
        const guild = client.guilds.cache.get("772760465390043148");
        if (guild === undefined) throw new Error("Guild not found");
        zitate.forEach(async (zitat, index) => {
            // Get the message from the discord api
            if (zitat.contextLink === undefined) return;
            try {
                // Get messageId from the contextLink
                const messageId = zitat.contextLink.split("/").pop();
                const channelId = zitat.contextLink.split("/").slice(-2)[0];
                const channel = guild.channels.cache.get(channelId) as TextChannel;
                if (messageId === undefined) return;
                if (channel === undefined) return;
                const message = await channel.messages.fetch(messageId);
                console.log(`Syncing zitat ${index} of ${zitate.length}`);
                // Update the timestamp
                zitat.timestamp = message.createdAt;
                await zitat.save();
            } catch (e) {
                console.log(`Error while syncing zitat ${index}, skipping... (${e})`);
            }
        });
    }

    async initUserBasedPrompt(discordId: string): Promise<void> {
        const namePrompt = await this.nameBasedPromptModel.findOne({ name: "Horby" });
        const newPrompt = new this.userBasedPromptModel({ prompt: namePrompt, user_id: discordId });
        await newPrompt.save();
    }

    async listPrompts(): Promise<String> {
        const prompts = await this.nameBasedPromptModel.find();
        let promptString = "";
        prompts.forEach(prompt => {
            promptString += `\`${prompt.name}\`, `;
        });
        // remove last 2 chars
        promptString = promptString.slice(0, -2);
        return promptString;
    }


    async showPrompt(discordId: string): Promise<String> {
        const userPrompt = await this.userBasedPromptModel.findOne({ user_id: discordId }).populate('prompt');
        if (userPrompt === null) {
            await this.initUserBasedPrompt(discordId);
            return this.showPrompt(discordId);
        }
        return userPrompt.prompt.prompt;
    }

    async setUserBasedPrompt(discordId: string, prompt_name: string): Promise<void> {
        const userPrompt = await this.userBasedPromptModel.findOne({ user_id: discordId });
        const prompt = await this.nameBasedPromptModel.findOne({ name: prompt_name });
        if (prompt === null) throw new Error("Prompt not found");
        if (userPrompt === null) {
            const newPrompt = new this.userBasedPromptModel({ prompt: prompt, user_id: discordId });
            await newPrompt.save();
        }
        else {
            userPrompt.prompt = prompt;
            await userPrompt.save();
        }
    }

    async getNameBasedPrompt(name: string = "Horby"): Promise<String | null> {
        const prompt = await this.nameBasedPromptModel.findOne({ name: name });
        if (prompt === null) return null;
        else return prompt.prompt;
    }

    async setNameBasedPrompt(name: string, prompt: string): Promise<void> {
        const namePrompt = await this.nameBasedPromptModel.findOne({ name: name }).populate('prompt');
        if (namePrompt === null) {
            const newPrompt = new this.nameBasedPromptModel({ prompt: prompt, name: name });
            await newPrompt.save();
        }
        else {
            namePrompt.prompt = prompt;
            await namePrompt.save();
        }

    }


    async userExists(discordId: string): Promise<boolean> {
        const user = await this.userModel.findOne({ discordId: discordId });
        if (user === null) return false;
        return true;
    }

    async verifyUser(dhusername: string, discordId: string): Promise<boolean> {
        const user = await this.userModel.findOne({ dhusername: dhusername, discordId: discordId });
        return user !== null;
    }

    async getUser(discordId: string): Promise<IUser | null> {
        const user = await this.userModel.findOne({ discordId: discordId });
        return user;
    }

    async getRandomDavinciData(): Promise<IDavinciData | null> {

        const count = await this.davinciDataModel.countDocuments();
        const rand = Math.floor(Math.random() * count);
        const random = await this.davinciDataModel.findOne().skip(rand);
        return random;


    }

    async getRandomChatPrompt(): Promise<IChatPrompt | null> {
        const count = await this.chatPromptModel.countDocuments();
        const rand = Math.floor(Math.random() * count);
        const random = await this.chatPromptModel.findOne().skip(rand);
        return random;
    }

    async getChatPrompt(): Promise<IChatPrompt | null> {
        return this.chatPromptModel.findOne({ selected: true });
    }

    async getRandomWeightedDavinciData(): Promise<IDavinciData | null> {
        const allPersonalityDescriptions = await this.davinciDataModel.find();
        let sumOfWeights = allPersonalityDescriptions.reduce((sum, current) => sum + (current.weight || 1), 0);
        let random = Math.random() * sumOfWeights;
        let randomIndex = 0;
        while (random > 0) {
            random -= allPersonalityDescriptions[randomIndex].weight || 1;
            randomIndex++;
        }
        randomIndex--;
        return allPersonalityDescriptions[randomIndex];
    }

    async setDavinciData(data: IDavinciData): Promise<IDavinciData> {
        const dataModel = new this.davinciDataModel(data);
        return dataModel.save();
    }


    async addUser(dhusername: string, discordId: string, course: string): Promise<IUser> {
        const user = new this.userModel({
            dhusername: dhusername,
            discordId: discordId,
            roles: [],
            course: course
        });
        return user.save();
    }

    async addWeirdZitat(id: string, zitat: string, contextLink: string) {
        const zitatModel = new this.zitatModel({
            discordId: id,
            zitat: zitat,
            weird: true,
            author: "",
            image: "",
            reference: null,
            contextLink: contextLink
        });
        return zitatModel.save();
    }

    async addZitat(id: string, zitat: string, author: string, contextLink: string, reference: IZitat | null, imageURL?: string): Promise<IZitat> {
        const zitatModel = new this.zitatModel({
            discordId: id,
            zitat: zitat,
            image: imageURL,
            reference: reference,
            contextLink: contextLink,
            author: author,
            weird: false,
            timestamp: new Date()
        });
        return zitatModel.save();
    }

    async zitatExists(id: string): Promise<boolean> {
        const zitat = await this.zitatModel.findOne({ discordId: id });
        return zitat !== null;
    }
}

const dba = {
    instance: null as DatabaseAdapter | null,
    setInstance: (host: string, user: string, password: string, db: string) => {
        dba.instance = new DatabaseAdapter(host, user, password, db);
    },
    getInstance: () => {
        if (!dba.instance) throw new Error("Instance not set");
        return dba.instance;
    }
}

export default dba;


function dateToSnowFlake(date: Date) {
    return date.getTime() - 1420070400000;
}