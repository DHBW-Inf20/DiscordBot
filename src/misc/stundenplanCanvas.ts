import { createCanvas, Canvas } from 'canvas';
import { ScheduleWeek, ScheduleWeekData } from '../types/schedule';
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
    headerOffset?: number = 0;
    spans: number[];
    examcolor: string;
    bodyHeight?: number;
    textPadding: number;
    constructor(sched: ScheduleWeekData) {
        this.sched = sched.schedule;
        this.kw = sched.meta.kw
        this.spans = sched.meta.spans;
        this.startDate = getDateOfISOWeek(this.kw, sched.meta.year);
        this.endDate = new Date(this.startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
        this.width = 1920;
        this.height = 1080;
        this.cvs = createCanvas(this.width, this.height);
        this.context = this.cvs.getContext('2d');
        this.background = '#0A100D';
        this.foreground = '#B9BAA3';
        this.tilecolor = '#902923';
        this.linecolor = '#A22C29';
        this.examcolor = '#DD2C29';
        this.tileforeground = '#D6D5C9';
        this.tileMargin = 10;
        this.timelineWidth = 0;//(this.width / 6) * 0.75;
        this.tileWidth = (this.width - this.timelineWidth) / 5;
        this.bodyHeight = this.height - (this.headerOffset || 0);
        this.tilePadding = 30;
        this.textPadding = 15;
    }

    renderCanvas() {

        // this.setupHeader();
        // this.drawTimeline();
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

            // let maxColN = this.spans.slice(0).sort((a, b) => b - a)[0] - 3;
            // if (maxColN > 0) maxColN /= 2;

            for (let lesson of this.sched[day]!) { // Berechne die optimale Schriftgröße //TODO: Optimieren
                let n = 100;
                this.context.font = `${n}px Consolas`;
                const nameSplit = lesson.moduleName.split(" ")[0];
                const shortenedName = nameSplit.length === 1 ? nameSplit[0] : nameSplit[0] + ".";
                while (this.context.measureText(lesson.moduleName).width > this.tileWidth * 0.85) {
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
            let span = this.spans[i]; // Wie viel platz nimmt der Tag ein? Normal ist 3, pro Extra spalte kommen 2 dazu.
            let columns = span - 3; // Entweder eine Spalte (=0), oder n+1 Spalten (=2*n)
            if (columns > 0) columns /= 2; // 0..n spalten
            const multiColumn: boolean = columns > 0;
            let colWidth = this.tileWidth / (columns + 1); // Breite der Spalte

            if (this.sched[day] === undefined) {
                continue;
            }
            for (let lesson of this.sched[day]!) {
                let startTime = new Date(`0 ${lesson.from}:00`);
                let endTime = new Date(`0 ${lesson.to}:00`);
                let padding = !multiColumn ? this.tilePadding : this.tilePadding / columns;
                let fontSize = minN;

                if(multiColumn){
                    fontSize = minN / (columns * 0.8);
                }
                const colN = lesson.col || 0;
                startTime.setHours(startTime.getHours() + 1);
                endTime.setHours(endTime.getHours() + 1);
                let startY = map(startTime.getTime(), min.getTime(), max.getTime(), 0, this.bodyHeight!);
                let endY = map(endTime.getTime(), min.getTime(), max.getTime(), 0, this.bodyHeight!);
                let startX = this.tileMargin + (colWidth * (colN)) + (this.tileWidth * i);
                if(colN > 0) {

                    startX -= this.tileMargin / 2;
                
                }
                let endX = this.tileMargin + (colWidth * (colN + 1)) + (this.tileWidth * i);
                this.context.fillStyle = lesson.type == 'exam' ? this.examcolor : this.tilecolor;
                roundRect(this.context, startX, startY, colWidth - this.tileMargin, endY - startY, 40, this.foreground);
                this.context.fillStyle = this.tileforeground;
                this.context.font = `bold ${fontSize}px Consolas`;
                if (lesson.type === "exam") {

                    let displayString = `${lesson.moduleName}-Klausur in ${lesson.room} (${lesson.from}-${lesson.to})`;
                    let lines = getLines(this.context, displayString, colWidth - this.tileMargin - this.tilePadding * 2);
                    let th = 0;
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        let textDimensions = this.context.measureText(`${line}`);
                        th += (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
                        let x = startX + padding;
                        let y = startY + th + this.tilePadding + (i * 9);
                        this.context.fillText(`${line}`, x, y);
                    }
                    return;

                }
                
                const lines = getLines(this.context, lesson.moduleName, colWidth - this.tileMargin - this.textPadding);
                let courseTextHeight = 0;
                for(let i = 0; i<lines.length; i++) {
                    const line = lines[i];
                let textDimensions = this.context.measureText(`${line}`);
                    courseTextHeight += (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
                let x = startX + padding;
                let y = startY + courseTextHeight + this.tilePadding + (i * 5);
                this.context.fillText(`${line}`, x, y);
            }

                let textDimensions = this.context.measureText(`${lesson.room}`);
                this.context.font = `${fontSize}px Consolas`;
                let roomTextHeight = (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
                let x = startX + padding;
                let y = startY + padding  + courseTextHeight + roomTextHeight + this.textPadding * 2;
                this.context.fillText(`${lesson.room}`, x, y);

                if(!multiColumn){
                textDimensions = this.context.measureText(`${lesson.from}-${lesson.to}`);
                let timeTextHeight = (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
                x = startX + padding;
                y = startY + padding + courseTextHeight + roomTextHeight + timeTextHeight + this.textPadding * 3;
                this.context.fillText(`${lesson.from}-${lesson.to}`, x, y);}
                else {
                    this.context.font = `${fontSize}px Consolas`;
                    textDimensions = this.context.measureText(`${lesson.from}-`);
                    let timeTextHeight = (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
                    x = startX + padding;
                    y = startY + padding + courseTextHeight + roomTextHeight + timeTextHeight + this.textPadding * 3;
                    this.context.fillText(`${lesson.from}-`, x, y);
                    this.context.font = `${fontSize}px Consolas`;
                    textDimensions = this.context.measureText(`${lesson.to}`);
                    timeTextHeight = (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent);
                    x = startX + padding;
                    y = startY + padding + courseTextHeight + roomTextHeight + timeTextHeight*2 + this.textPadding * 3.5;
                    this.context.fillText(`${lesson.to}`, x, y);
                }
                

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

/**
 * 
 * Source: https://stackoverflow.com/a/16599668/14379859 Modified to work for letters
 */

function getLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    var letters = text.split("");
    var lines = [];
    var currentLine = letters[0];
    
    for (var i = 1; i < letters.length; i++) {
        var letter = letters[i];
        var width = ctx.measureText(currentLine + letter).width;
        if (width < maxWidth) {
            currentLine += letter;
        } else {
            lines.push(currentLine);
            currentLine = letter;
        }
    }
    lines.push(currentLine);
    return lines;
}