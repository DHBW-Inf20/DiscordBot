export interface Config {
    dev: boolean;
    discord: {
        token: string;
        main_guild: string;
        zitate_channel: string;
        verification_channel: string;
        roles_channel: string;
    },
    dualis: {
        user: string;
        password: string;
    },
    email: {
        user: string;
        password: string;
    },
    intranet: {
        user: string;
        password: string;
    },
    support: {
        userid: string;
    },
    db: {
        host: string;
        user: string;
        password: string;
        database: string;
    }
}