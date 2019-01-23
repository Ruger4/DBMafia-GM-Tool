const nsItems = ["Gun", "Armour", "Report", "Bread", "Moonshine", "Evidence"]
const nsAlignment = ["Village", "Mafia", "Nobody", "Cult"]

const nsVillagers = ["Baker", "Barkeep", "Blacksmith", "Bodyguard", "Comedian", "Commuter", "Cop", "Coroner", 
"Deputy", "Detective", "Doctor", "Driver", "Farmer", "Govenor", "Gunsmith", "Hunter", "Innocent Child", 
"Jack-of-all-trades", "Jailor", "Mayor", "Neighbour", "Nurse", "Postman", "Priest", "Reporter", "Sidekick", 
"Town Drunk", "Tracker", "Veteran", "Vigilante", "Virgin", "Watcher"];
const nsMafia = ["Apprentice", "Bookie", "Bouncer", "Chauffeur", "Framer", "Godfather", "Hooker", "Janitor", 
"Lawyer", "Ninja", "Poisoner", "Politician", "Saboteur", "Silencer", "Spy", "Strongman", "Tailor", "Thief"];
const nsThirds = ["Amnesiac", "Arsonist", "Blackmailed", "Bootlegger", "Cult Leader", "Fool", "Hypnotist", 
"Lover", "Lyncher", "Serial Killer", "Survivor", "Terrorist", "Turncoat"];

var gblPlayerList = [];
var gblPlayerDictionary = {};
var gblActionManager = [];
var gblMessageManager = new MessageManager();
var gblGameCycles = 0;

var gblMafiaKill = {};
var gblMafiaKill2 = {};

function pendingCheck(){
    gblMessageManager.pendingCheck()
}

function phaseText(x){
    if(x & 1) { return "Night " + (x - Math.floor(x*0.5)) }
    else { return "Day " + ((x + 1) - Math.floor(x*0.5)) }
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
}

Array.prototype.toOrderedString = function(){
    if(this.length > 1){
        var out = "";
        var i = this.length-1;
        while (i--) {
            i > 0 ? out += this[i] + ", " : out += this[i];
        }
        out += " and " + this[this.length-1];
        return out
    } else return this[0]
}

Array.prototype.clone = function() {
    return this.slice(0);
}

Array.prototype.contains = function(value) {
    var i = this.length;
    while (i--) {
        if (this[i].getName === value) {
            return true;
        }
    }
    return false;
}

Array.prototype.returnContains = function(value) {
    var i = this.length;
    while (i--) {
        if (this[i].getName === value) {
            return this[i];
        }
    }
    return false
}

Array.prototype.returnTargetList = function(value, type) {
    var targList = [];
    if(!type) type = "";
    for(var key in gblPlayerDictionary){
        switch (type) {
            case "Village":
                if(gblPlayerDictionary[key].getAlign === "Village"){ targList.push(key) }
                break;
            case "Alive Village":
                if(gblPlayerDictionary[key].getAlign === "Village" && gblPlayerDictionary[key].getAlive){ targList.push(key) }
                break;
            case "Mafia":
                if(gblPlayerDictionary[key].getAlign === "Mafia"){ targList.push(key) }
                break;
            case "Alive Mafia":
                if(gblPlayerDictionary[key].getAlign === "Mafia" && gblPlayerDictionary[key].getAlive){ targList.push(key) }
                break;
            case "Cult":
                if(gblPlayerDictionary[key].getAlign === "Cult"){ targList.push(key) }
                break;
            case "Alive Cult":
                if(gblPlayerDictionary[key].getAlign === "Cult" && gblPlayerDictionary[key].getAlive){ targList.push(key) }
                break;
            case "Alive": default:
                if(gblPlayerDictionary[key].getAlive){ targList.push(key) }
                break;
        }
    }
    if(value) targList.remove(value);
    return targList
}

Array.prototype.returnDeadList = function() {
    var targList = this.clone();
    for(var key in gblPlayerDictionary){ 
        if(gblPlayerDictionary[key].getAlive){ 
            targList.remove(key) 
        }
    }
    return targList
}

Array.prototype.removeToOther = function(value, target) {
    var x = value;
    if(typeof value === "string") x = this.returnContains(value);
    if(this.includes(x)){
        target.push(x)
        this.remove(x)
    }
}

Array.prototype.lowest = function() {
    var x = new Action("");
    x.setPriority = 500;
    var lowest = x
    var tmp;
    for (var i=this.length-1; i>=0; i--) {
        tmp = this[i];
        if (tmp.getPriority < lowest.getPriority && tmp.getDelay === 0) lowest = tmp;
    }
    if(lowest === x) return false
    return lowest
}