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

export interface IDavinciData{
    personality_description: string,
    temperature: number,
    max_tokens: number,
    top_p: number,
    weight: number
}

export interface IChatPrompt{
    prompt: string,
    selected: boolean
}

export interface IUserBasedPrompt{
    prompt: INameBasedPrompt,
    user_id: string
}

export interface INameBasedPrompt{
    prompt: string,
    name: string
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

    userModel: mongoose.Model<IUser>;
    zitatModel: mongoose.Model<IZitat>;
    davinciDataModel: mongoose.Model<IDavinciData>;
    chatPromptModel: mongoose.Model<IChatPrompt>;
    userBasedPromptModel: mongoose.Model<IUserBasedPrompt>;
    nameBasedPromptModel: mongoose.Model<INameBasedPrompt>;
    constructor(host: string, user: string, password: string, dbname: string) {
        mongoose.connect(`mongodb+srv://${user}:${password}@${host}/${dbname}?retryWrites=true&w=majority`);

        const DavinciDataSchema = new mongoose.Schema<IDavinciData>({
            personality_description: String,
            temperature: Number,
            max_tokens: Number,
            top_p: Number,
            weight: Number
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

    async getUserBasedPrompt(discordId: string): Promise<String | null> {
        const prompt = await this.userBasedPromptModel.findOne({ user_id: discordId }).populate('prompt');
        if (prompt === null){
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

    async syncZitateBeforeDataTime(client: Client){
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
        do{
            // Get date in this format '%b %d %Y %I:%M%p'
            const messages = await zitateChannel.messages.fetch({ limit: 100 
            , before: lastTimeStamp}) as Collection<string, Message>;
        console.log("Fetched messages n:" + messages.size);
        let i = 0;

        for(let message of messages.values()){

        // Go through every message one by one and add it to the database
            // Check if the message is already in db, (is a embed in the message)
            i++;
            if ( message.embeds.length !== 0) return;
            if( i % 10 === 0) console.log(`Syncing message ${i} of ${messages.size}`);
            let messageImage = message.attachments.first();
            let messageText = message.content;
            if (messageText === "") {
                if (messageImage === undefined) return;
                messageText = "<no text>";       
            }
            let messageSplit = messageText.split("-");

            let author = "unknown"
            let zitatText = messageText;
            if(messageSplit.length >= 2){
                author = messageSplit[messageSplit.length - 1].trim();
                zitatText = messageSplit.slice(0, messageSplit.length - 1).join("-").trim();
                // Replace the quotes if there are any at the start or beginning
                if (zitatText.startsWith("\"") && zitatText.endsWith("\"")) zitatText = zitatText.slice(1, zitatText.length - 1);
            }

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
        isDone = messages.size < 100;
            if (messages.last()?.createdAt !== undefined){
                lastTimeStamp = dateToSnowFlake(messages.last()!.createdAt).toString();
            }else{
                isDone = true;
            }

    }while(!isDone)

    }

    async syncTimeStampForZitat(client: Client){
        // Go through every Zitat in the database one by one
        const zitate = await this.zitatModel.find();
        const guild = client.guilds.cache.get("772760465390043148");
        if (guild === undefined) throw new Error("Guild not found");
        zitate.forEach(async (zitat, index) => {
            // Get the message from the discord api
            if(zitat.contextLink === undefined) return;
            try{    
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
            }catch (e){
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
        return this.chatPromptModel.findOne( { selected: true });   
    }

    async getRandomWeightedDavinciData(): Promise<IDavinciData | null> {
        const allPersonalityDescriptions = await this.davinciDataModel.find();
        let sumOfWeights =  allPersonalityDescriptions.reduce((sum, current) => sum + (current.weight || 1), 0);
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

    async addWeirdZitat(id: string, zitat: string, contextLink: string){
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

    async addZitat(id: string, zitat: string, author: string, contextLink:string,  reference: IZitat | null,imageURL?: string): Promise<IZitat> {
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
        const zitat = await this.zitatModel.findOne({ discordId : id });
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


function dateToSnowFlake(date: Date){
    return date.getTime() - 1420070400000;
}