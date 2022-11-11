export interface Config {
    discord: {
        token: string;
        main_guild: string;
        zitate_channel: string;
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
    }
}