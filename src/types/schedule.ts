export interface Grade{
    moduleId: string;
    moduleName: string;
    grade: boolean; // true = grade is given, false = grade is not given
}

export type Wochentag = "Montag" | "Dienstag" | "Mittwoch" | "Donnerstag" | "Freitag" ;
export type wochentag = "montag" | "dienstag" | "mittwoch" | "donnerstag" | "freitag" ;

export interface Schedule{
    moduleName: string;
    from: string;
    timestamp_from?: Date;
    to: string;
    timestamp_to?: Date;
    room: string;
    person?:string;
    course?:string;
    col?:number;
    type?: 'lecture' | 'exam';
}


export type ScheduleWeek =  {
    montag?: Schedule[];
    dienstag?: Schedule[];
    mittwoch?: Schedule[];
    donnerstag?: Schedule[];
    freitag?: Schedule[];
}

export type ScheduleWeekData = {
    meta:{
        kw: number;
        year: number;
        spans: number[];
    },
    schedule: ScheduleWeek
}
export interface Menu{
    meals: {[name: string]: string}; // name = name of the dish, value = price
    previews: {[name: string]: string}; // name = name of the dish, value = link to preview
    date: Date;
}