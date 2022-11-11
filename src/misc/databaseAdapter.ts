import mongoose from 'mongoose';


interface DBA {
    initDB(): Promise<void>;
}

class DatabaseAdapter implements DBA {
    db: mongoose.Connection;
    constructor(host: string, user: string, password: string, dbname: string) {
        this.db =  mongoose.createConnection(`mongodb+srv://${user}:${password}@${host}/${dbname}?retryWrites=true&w=majority`);
    }
    initDB(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    close(): void {
        this.db.close();
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
