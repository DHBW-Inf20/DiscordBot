export interface Grade{
    moduleId: string;
    moduleName: string;
    grade: boolean; // true = grade is given, false = grade is not given
}

export interface Schedule{
    moduleName: string;
    from: string;
    to: string;
    room: string;
    person?:string;
    course?:string;
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
    },
    schedule: ScheduleWeek
}
export interface Menu{
    meals: {[name: string]: string}; // name = name of the dish, value = price
    previews: {[name: string]: string}; // name = name of the dish, value = link to preview
    date: Date;
}