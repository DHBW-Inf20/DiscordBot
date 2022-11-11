import mongoose from 'mongoose';


interface DBA {
    initDB(): Promise<void>;
}

interface IUser {
    dhusername: string,
    discordId: string,
    roles: string[],
    course: string,
}

class DatabaseAdapter implements DBA {

    userModel: mongoose.Model<IUser>;
    constructor(host: string, user: string, password: string, dbname: string) {
      mongoose.connect(`mongodb+srv://${user}:${password}@${host}/${dbname}?retryWrites=true&w=majority`);

        const UserSchema = new mongoose.Schema<IUser>({
            dhusername: String,
            discordId: String,
            roles: [String],
            course: String,
        });

        this.userModel = mongoose.model<IUser>('User', UserSchema);
        
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

    async addUser(dhusername: string, discordId: string, course: string): Promise<IUser> {
        const user = new this.userModel({
            dhusername: dhusername,
            discordId: discordId,
            roles: [],
            course: course
        });
        return user.save();
    }
}

const dba = {
    instance: null as DatabaseAdapter | null,
    setInstance: (host:string, user:string, password:string, db:string) => {
        dba.instance = new DatabaseAdapter(host, user, password, db);
    },
    getInstance: () => {
        if(!dba.instance) throw new Error("Instance not set");
        return dba.instance;
    }
}

export default dba;
