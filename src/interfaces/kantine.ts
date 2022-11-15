import fetch from "node-fetch";
import { Menu } from "../types/schedule";
import { parse } from 'node-html-parser'

export interface kantine {
    baseUrl: string;
    locId: 2 | 16 | 4 | 7 | 1 | 6 | 9 | 12 | 13 | 21;
    lastDay?: number;
    cachedPreviews?: Menu["previews"]
    getMenu: (day?: number, locId?: kantine["locId"]) => Promise<Menu>;
}

export class Kantine implements Kantine {
    baseUrl: string = "https://sws2.maxmanager.xyz/inc/ajax-php_konnektor.inc.php/";
    locId: kantine["locId"];
    lastDay?: number;
    cachedPreviews?: Menu["previews"]
    constructor(locId: kantine["locId"]) {
        this.locId = locId;
    }

    getMenu: (day?: number, locId?: kantine["locId"]) => Promise<Menu> = async (day?: number, locId?: kantine["locId"]) => {

        // determine correct parameter
        day = day == undefined ? this.lastDay : day;
        if (!day) {
            this.lastDay = day = 0;
        }
        this.lastDay = day;

        locId = locId || this.locId;

        // declare Headers

        const headers = {
            "Accept-Encoding": "gzip, deflate",
            "Cookie": `domain=sws2.maxmanager.xyz; savekennzfilterinput=0; splsws=98p88kujcf954dp0lcvcteteml; locId=${locId}`,
            "Content-Type": "application/x-www-form-urlencoded"
        }

        // Get the correct Date in the Format "YYYY-MM-DD"
        // ("0" + date.getDay() + 1).slice(-2) is to always get a double digit number (e.g. "01" instead of "1")
        const date = new Date();
        date.setDate(date.getDate() + day);

        const dateString = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;

        // Get the start of the Week of this Date
        const startOfWeek = new Date(date.getTime());
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const startOfWeekString = `${startOfWeek.getFullYear()}-${("0" + (startOfWeek.getMonth() + 1)).slice(-2)}-${("0" + startOfWeek.getDate()).slice(-2)}`;

        // Get the end of the Week of this Date
        const endOfWeek = new Date(date.getTime());
        endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
        const endOfWeekString = `${endOfWeek.getFullYear()}-${("0"+(endOfWeek.getMonth() + 1)).slice(-2)}-${("0"+endOfWeek.getDate()).slice(-2)}`;

        const payload = `func=make_spl&locid=${locId}&date=${dateString}&lang=de&startThisWeek=${startOfWeekString}&startNextWeek=${endOfWeekString}`;
        
        const response = await fetch(`${this.baseUrl}`,{
            method: "POST",
            headers,
            body: payload
        }) 


        let html:string = await response.text();
        // parse html
        let menu: Menu = {
            meals: {},
            previews: {},
            date: date
        };
        const parsed = parse(html);
        parsed.getElementsByTagName("div").filter(element => {
           return element.attributes.class?.includes("splMeal")
        }).forEach(meal =>{
            const mealName = meal.getElementsByTagName("div").filter(element => element.attributes.class === "col-md-6 col-sm-5 visible-sm-block visible-md-block visible-lg-block")[0].getElementsByTagName("span")[0].text;

            const mealPrice = meal.getElementsByTagName("div").filter(element => element.attributes.class === "col-md-2 col-sm-3 visible-sm-block visible-md-block visible-lg-block")[0].getElementsByTagName("div")[0].text.trim();

            const fotoLink = meal.getElementsByTagName("div").filter(element => element.attributes.class?.includes("contains-foto"))[0].getElementsByTagName("img");

            menu.meals[mealName] = mealPrice;
            if(fotoLink.length > 0){
                menu.previews[mealName] = "https://sws2.maxmanager.xyz/" + fotoLink[0].attributes.src;
            }
        })
        this.cachedPreviews = menu.previews;
        return menu;
    }
}