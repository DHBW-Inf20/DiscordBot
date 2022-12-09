import mongoose from 'mongoose';


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

export interface IZitat {
    discordId: string,
    zitat: string,
    image: string,
    reference: IZitat | null,
    author: string,
    weird: boolean,
    contextLink: string,

}

class DatabaseAdapter implements DBA {


    async getZitat(referencedID: string): Promise<IZitat | null> {
        return this.zitatModel.findOne({ discordId: referencedID });
    }

    userModel: mongoose.Model<IUser>;
    zitatModel: mongoose.Model<IZitat>;
    davinciDataModel: mongoose.Model<IDavinciData>;
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
            reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Zitat' }
        });

        this.userModel = mongoose.model<IUser>('User', UserSchema);
        this.zitatModel = mongoose.model<IZitat>('Zitat', ZitatSchema);
        this.davinciDataModel = mongoose.model<IDavinciData>('DavinciData', DavinciDataSchema);
    }
    initDB(): Promise<void> {
        throw new Error("Method not implemented.");
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
            weird: false
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
