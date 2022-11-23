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


export interface wmData {
    matchID: number;
    machDateTime: string;
    leagueId: number;
    leagueName: string;
    leagueShortcut: string;
    matchDateTimeUTC: string;
    group: {
        groupName: string;
        groupOrderID: number;
        groupID: number;
    },
    team1: wmTeamData,
    team2: wmTeamData,
    lastUpdateDateTime: string,
    matchIsFinished: boolean,
    matchResults: wmMatchResult[]
    goals: wmGoal[]
    location: {
        locationCity: string;
        locationStadium: string;
    },
    numberOfViewers: number
}


export interface wmMatchResult {
    resultID: number;
    resultName: string;
    pointsTeam1: number;
    pointsTeam2: number;
    resultOrderID: number;
    resultTypeID: number;
    resultDescription: string;
}

export interface wmGoal {
    goalID: number;
    scoreTeam1: number;
    scoreTeam2: number;
    matchMinute: number;
    goalGetterID: number;
    goalGetterName: string;
    isPenalty: boolean;
    isOwnGoal: boolean;
    isOvertime: boolean;
    comment: string;
}
export interface wmTeamData {
    teamName: string;
    teamId: number;
    shortName: string;
    teamIconUrl: string;
    teamGroupName: string;
}