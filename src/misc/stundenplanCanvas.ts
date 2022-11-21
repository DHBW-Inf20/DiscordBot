import { createCanvas, Canvas } from 'canvas';
import { ScheduleWeek } from '../types/schedule';
import fs from 'fs';


export class StundenplanCanvas {
    sched:ScheduleWeek;
    kw:number;
    startDate: Date;
    endDate:Date;
    cvs: Canvas;
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    background: string;
    tileforeground: string;
    foreground: string;
    linecolor:string;
    tilecolor: string;
    tileMargin: number;
    tilePadding:number;
    tileWidth:number;
    timelineWidth: number;
    headerOffset?: number;
    bodyHeight?: number;
    constructor(sched:ScheduleWeek, kw: number, year: number) {
        this.sched = sched;
        this.kw = kw;
        this.startDate = getDateOfISOWeek(kw, year);
        this.endDate = new Date(this.startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
        this.width = 1920;
        this.height = 1080;
        this.cvs = createCanvas(this.width, this.height);
        this.context = this.cvs.getContext('2d');
        this.background = '#0A100D';
        this.foreground = '#B9BAA3';
        this.tilecolor = '#902923';
        this.linecolor = '#A22C29';
        this.tileforeground = '#D6D5C9';
        this.tileMargin = 10;
        this.timelineWidth = (this.width / 6) * 0.75;
        this.tileWidth = (this.width - this.timelineWidth) / 5;
        this.tilePadding = 20;
    }

    renderCanvas() {

        this.setupHeader();
        this.drawTimeline();
        this.drawSchedule();
    }

    getBuffer() {
        return this.cvs.toBuffer('image/png');
    }

    drawSchedule() {
        let days = ["montag", "dienstag", "mittwoch", "donnerstag", "freitag"] as Array<keyof ScheduleWeek>;
        let {min,max,steps} = this.getTimeRange();
        this.context.translate(this.timelineWidth, this.headerOffset!);
        let minN = 2000;
        for (let i = 0; i < days.length; i++) {
            let day = days[i];
            if (this.sched[day] === undefined) {
                continue;
            }
            for (let lesson of this.sched[day]!) {
                let n = 100;
                this.context.font = `${n}px Consolas`;
                while (this.context.measureText(lesson.moduleName).width > this.tileWidth * 0.95) {
                    n--;
                    this.context.font = `${n}px Consolas`;
                }
                if (n < minN) {
                    minN = n;
                }
                
            
            }
        }
        for (let i = 0; i<days.length; i++) {
            let day = days[i];
            if (this.sched[day] === undefined) {
                continue;
            }
            for (let lesson of this.sched[day]!) {
                let startTime = new Date(`0 ${lesson.from}:00`);
                let endTime = new Date(`0 ${lesson.to}:00`);
                startTime.setHours(startTime.getHours() + 1);
                endTime.setHours(endTime.getHours() + 1);
                let startY = map(startTime.getTime(), min.getTime(), max.getTime(), 0, this.bodyHeight!);
                let endY = map(endTime.getTime(), min.getTime(), max.getTime(), 0, this.bodyHeight!);
                let startX = this.tileMargin + (this.tileWidth * (i));
                let endX = this.tileMargin + (this.tileWidth * (i+1));
                this.context.fillStyle = this.tilecolor;
                roundRect(this.context, startX, startY, this.tileWidth-this.tileMargin, endY - startY, 5, this.foreground);
                this.context.fillStyle = this.tileforeground;

                this.context.font = `${minN}px Consolas`;
              
                let textDimensions = this.context.measureText(`${lesson.moduleName}`);
                let textHeight = (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
                let textWidth = textDimensions.width;
                let x = startX + this.tilePadding;
                let y = startY + this.tilePadding + textHeight;
                this.context.fillText(`${lesson.moduleName}`, x, y);
                this.context.font = (minN*0.95)+'px Consolas';
                textDimensions = this.context.measureText(`${lesson.room}`);
                let oldTextHeight = textHeight;
                textHeight = (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
                textWidth = textDimensions.width;
                x = startX + this.tilePadding;
                y = startY + this.tilePadding + textHeight + oldTextHeight * 1.5;
                this.context.fillText(`${lesson.room}`, x, y);

                textDimensions = this.context.measureText(`${lesson.from}-${lesson.to}`);
                textHeight = (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
                textWidth = textDimensions.width;
                x = startX + this.tilePadding;
                y = startY + this.tilePadding + textHeight + oldTextHeight * 1.5 + textHeight * 1.5;
                this.context.fillText(`${lesson.from}-${lesson.to}`, x, y);
                

            }
        }
        this.context.translate(-this.timelineWidth, -this.headerOffset!);
    }




    drawTimeline() {
        let {min,max,steps} = this.getTimeRange();
        this.context.translate(0, this.headerOffset || 0);

        this.bodyHeight = this.height - (this.headerOffset || 0);
        const timelineCellHeight = this.bodyHeight / steps;
        this.context.strokeStyle = this.linecolor;
        this.context.beginPath();
        this.context.moveTo(this.timelineWidth, 0);
        this.context.lineTo(this.timelineWidth, this.height);
        this.context.stroke();
        this.context.closePath();
        for(let i = 0; i < steps; i++){
            // Draw lines
            this.context.strokeStyle = this.linecolor;
            this.context.beginPath();
            this.context.moveTo(0, i * timelineCellHeight);
            this.context.lineTo(this.width, i * timelineCellHeight);
            this.context.stroke();
            this.context.closePath();

            // Draw time
            this.context.fillStyle = this.foreground;
            this.context.font = '30px Consolas';

            let textDimensions = this.context.measureText(`${shortTime(min)}`);

            let textHeight = (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
            let textWidth = textDimensions.width;
            let x = (this.timelineWidth - textWidth) / 2;
            let y = (i * timelineCellHeight) + (timelineCellHeight / 2) + (textHeight / 2);
            this.context.fillText(`${shortTime(min)}`, x, y);

            min = new Date(min.getTime() + (30 * 60 * 1000));
        }
        this.context.translate(0, -(this.headerOffset || 0));

    }

    getTimeRange() {
        let min = new Date(`0 23:59:59`);
        let max = new Date(`0 00:00:00`);

        let days = Object.keys(this.sched) as Array<keyof ScheduleWeek>;
        for (let day of days) {
            for (let lesson of this.sched[day]!) {
                let minTemp = new Date(`0 ${lesson.from}:00`);
                minTemp.setHours(minTemp.getHours() + 1)
                let maxTemp = new Date(`0 ${lesson.to}:00`);
                maxTemp.setHours(maxTemp.getHours() + 1)
                if (minTemp.getTime() < min.getTime()) {
                    min = minTemp;
                }
                if (maxTemp.getTime() > max.getTime()) {
                    max = maxTemp;
                }
            }
        }

        min.setMinutes(0);
        if(max.getMinutes() > 0){
            max.setHours(max.getHours() + 1);
            max.setMinutes(0);
        }
        let otherTime = min;
        let steps = 1;
        do {
            otherTime = new Date(otherTime.getTime() + (60 * 30 * 1000));
            steps++;
        } while (otherTime.getTime() < max.getTime()); 
        let delta = max.getTime() - min.getTime();
        return { min, max, steps, delta };
    }

    setupHeader(){
        this.context.fillStyle = this.background;
        this.context.fillRect(0, 0, this.width, this.height);

        this.context.fillStyle = this.foreground;

        this.context.font = '30px Consolas';
        let header = this.context.measureText('Stundenplan');
        this.context.fillText(`Stundenplan`, (this.width / 2) - (header.width / 2), (header.actualBoundingBoxAscent - header.actualBoundingBoxDescent) * 2.5);

        this.context.font = '15px Consolas';
        let headerText = `KW ${this.kw} (${shortDate(this.startDate)} - ${shortDate(this.endDate)})`
        let subheader = this.context.measureText(headerText);
        this.context.fillText(headerText, (this.width / 2) - (subheader.width / 2), (header.actualBoundingBoxAscent - header.actualBoundingBoxDescent) * 2.5 + (subheader.actualBoundingBoxAscent - subheader.actualBoundingBoxDescent) * 2);


        this.context.font = '25px Consolas';
        let weekHeader = this.context.measureText('KW');

        let days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
        let dayWidth = (this.width-this.timelineWidth) / 5;
        for (let i = 0; i < 5; i++) {
            this.context.fillText(days[i], this.timelineWidth + (i * dayWidth) + (dayWidth / 2) - (this.context.measureText(days[i]).width / 2), (header.actualBoundingBoxAscent - header.actualBoundingBoxDescent) * 2.5 + (subheader.actualBoundingBoxAscent - subheader.actualBoundingBoxDescent) * 2 + (weekHeader.actualBoundingBoxAscent - weekHeader.actualBoundingBoxDescent) * 2.3);
        }

        this.headerOffset = (header.actualBoundingBoxAscent - header.actualBoundingBoxDescent) * 2.5 + (subheader.actualBoundingBoxAscent - subheader.actualBoundingBoxDescent) * 2 + (weekHeader.actualBoundingBoxAscent - weekHeader.actualBoundingBoxDescent) * 2.5;
    }

    saveImage(path: string) {
        const buffer = this.cvs.toBuffer('image/png');
        fs.writeFileSync(path, buffer);
    }



}




function shortDate(date: Date): string {
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

function shortTime(date:Date): string{
    return `${("0"+(date.getHours()-1)).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}`;
}

export function map(n:number, start1:number, stop1:number, start2:number, stop2:number):number{
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

function daySeconds(d:Date){
    return (d.getSeconds() + (d.getMinutes() * 60) + (d.getHours() * 60 * 60));
}

 function roundRect(
    ctx:any,
    x:any,
    y:any,
    width:any,
    height:any,
    radius:any = 20,
    fill:any = true,
    stroke:any = false
) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}


/* For a given date, get the ISO week number
 *
 * Based on information at:
 *
 *    THIS PAGE (DOMAIN EVEN) DOESN'T EXIST ANYMORE UNFORTUNATELY
 *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
 *
 * Algorithm is to find nearest thursday, it's year
 * is the year of the week number. Then get weeks
 * between that date and the first day of that year.
 *
 * Note that dates in one year can be weeks of previous
 * or next year, overlap is up to 3 days.
 *
 * e.g. 2014/12/29 is Monday in week  1 of 2015
 *      2012/1/1   is Sunday in week 52 of 2011
 */
export function getWeekNumber(d: Date) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    // Return array of year and week number
    return [d.getUTCFullYear(), weekNo];
}

export function getDateOfISOWeek(w: number, y: number) {
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}
