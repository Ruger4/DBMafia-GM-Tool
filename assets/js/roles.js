class Player {
    constructor(name){
        this.name = name;
        this.alive = true;
        this.deathCycle = 0;
        this.killer = "";
        this.alignment = [];
        this.role = "";
        this.roleReport = "";
        this.roleReveal = true;
        this.blocked = [];
        this.protection = [];
        this.items = [];
        this.actions = [];
        this.departure = {};
        this.arrivals = {};
    }

    get getName(){ return this.name };
    get getRole(){ return this.role };
    get getRoleReport(){ return this.roleReport };
    get getRoleReveal(){ return this.roleReveal };
    get getDeathCycle(){ return this.deathCycle };
    get getKiller(){ return this.killer };
    get getAlign(){ return this.alignment[0] };
    get investigateAlignment(){ return this.alignment[this.alignment.length-1] };
    get getAlive(){ return this.alive };
    get getActions(){ return this.actions };
    get getItems(){ return this.items };
    get getBlocked(){ return this.blocked };
    get getArrivals(){ return this.arrivals };
    get getDeparture(){ return this.departure };
    get getSabotage(){
        var sabotage = gblActionManager.find((act) => act.getName === "Sabotage" && act.getTarget === this.name);
        if(sabotage) return true
        else return false
    }

    set setKiller(killer){ this.killer = killer; }
    set setRoleReveal(bool){ this.roleReveal = bool; };
    set setAlign(align){ this.alignment[0] = align; };
    set addAlign(align){ this.alignment.push(align); };
    set addArrival(arrival){ (this.arrivals[gblGameCycles] || (this.arrivals[gblGameCycles] = [])).push(arrival) }
    set addDeparture(depart){ (this.departure[gblGameCycles] || (this.departure[gblGameCycles] = [])).push(depart) }
    set addItem(item){
        if(item === "Armour" && this.items.includes("Armour")){
            gblMessageManager.push(new Message("!GameLog", "Armour sent to " + this.name + " was destroyed because they already had Armour."))
            return
        }
        gblMessageManager.addItemMsg(this.name, item)
        this.items.push(item) 
    }
    removeItem(item){
        if(item){
            if(!this.items.includes(item)) return false
            if(this.alive){ 
                gblMessageManager.removeItemMsg(this.name, item)
                this.items.remove(item)
            }
            return true
        } else {
            var rand = this.items[Math.floor(Math.random() * this.items.length)];
            if(this.alive && rand){ 
                gblMessageManager.removeItemMsg(this.name, rand)
                this.items.remove(rand)
            }
            return rand 
        }
    }
    set addBlock(player){ this.blocked.push(player) }
    set addProtect(player){ this.protection.push(player) }
    set setAlive(bool){ 
        this.alive = bool;
        if(bool) return
        var sList = gblActionManager.filter((act) => act.getName === "Soul Link");
        var i = sList.length;
        while (i--) { 
            if(sList[i].getOwner === this.name || sList[i].getTarget === this.name) sList[i].trigger() 
        }
        this.deathCycle = gblGameCycles;
        gblMessageManager.setDead = this.name;
    }

    kill(bypass, killer){
        if(!bypass){
            if(this.items.includes("Armour") && !this.protection.includes("Armour") && !this.getSabotage) this.protection.push("Armour")
            if(this.role === "Sidekick" || this.role === "Veteran" || this.role === "Turncoat"){
                var action = gblActionManager.find((act) => act.getName === "Role Protect" && act.getOwner === this.name);
                if(action) action.trigger(killer)
            }
            var protectList = this.protection.clone();
            if(protectList.length > 0){
                var guardList = gblActionManager.filter((act) => act.constructor.name === "Guard" && protectList.includes(act.getOwner))
                if(guardList) {
                    var j = guardList.length;
                    while (j--) { guardList[j].trigger(killer) }
                }
                return [false, ", but "+ this.name +" was protected by "+ protectList.toOrderedString() +"."]
            }
            gblActionManager.push(new Death(killer, this.name))
            this.killer = killer;
            return [true, ", and suceeds killing "+ this.name +"."]
        }
        gblActionManager.push(new Death(killer, this.name))
        this.killer = killer;
        return [true, ", and suceeds killing "+ this.name +", bypassing all protection."]
    }
    lynch(){ 
        this.alive = false;
        gblMessageManager.push(new Message("!GameLog", this.name + " was lynched by the village."))
    }

    actionTransfer(action){ this.actions.removeToOther(action, gblActionManager) }

    init(){ return };
    reset(){
        while(this.alignment.length > 1) { this.alignment.pop() }
        if(this.protection.includes("Armour")) this.removeItem("Armour")
        if(this.items.includes("Evidence")){
            if(!this.actions.contains("Pass Evidence")) this.actions.push(new PassItem(this.name, "Evidence"))
        } else {
            if(this.actions.contains("Pass Evidence")) this.actions.remove(this.actions.filter((act) => act.getName === "Pass Evidence"))
        }
        if(this.items.includes("Moonshine")){
            if(!this.actions.contains("Pass Moonshine")) this.actions.push(new PassItem(this.name, "Moonshine"))
        } else {
            if(this.actions.contains("Pass Moonshine")) this.actions.remove(this.actions.filter((act) => act.getName === "Pass Moonshine"))
        }
        this.blocked = [];
        this.protection = [];
        this.eventScan()
    }
    eventScan(){ return }

    draw(){
        gblGameCycles & 1 ?
        this.drawNight() :
        this.drawDay();
    }
    drawDay(){
        if(!this.alive){
            var entry = document.createElement('li');
            entry.className = "lir Dead";
            // push name to entry
            var name = document.createElement('div');
            name.className = "list-name";
            name.innerText = this.name;
            entry.appendChild(name);
            var role = document.createElement('div');
            role.className = "list-role";
            role.innerText = ":" + this.role;
            entry.appendChild(role);
            document.getElementById("DeadListID").appendChild(entry)
            return
        }
        // create li box
        var entry = document.createElement('li');
        document.getElementById(this.alignment[0] + "ListID").appendChild(entry)
        entry.className = "lir " + this.alignment[0];
        // push name to entry
        var name = document.createElement('div');
        name.className = "list-name";
        name.innerText = this.name;
        entry.appendChild(name);
        // push role to entry
        var role = document.createElement('div');
        role.className = "list-role";
        role.innerText = ":" + this.role;
        entry.appendChild(role);

        if(!this.items.includes("Gun")) return

        var targSelect = document.createElement('select');
        targSelect.className = "form select tg-ico mrlp5";
        targSelect.id = this.name +"GunID";
        var tl = gblPlayerList.returnTargetList(this.name)
        for(var i=0; i<tl.length; i++){ targSelect.add(new Option(tl[i])); }
        targSelect.selectedIndex = 0;
        entry.appendChild(targSelect)

        var fireButton = document.createElement('button');
        fireButton.className = "btn btn-run mrlp5";
        fireButton.innerText = "Shoot";
        fireButton.onclick = () => { 
            var select = document.getElementById(this.name + "GunID");
            var target = gblPlayerDictionary[select.value];

            if(this.getSabotage){
                gblMessageManager.push(new Message("!GMAction", "-> Declare that "+ this.name +"'s gun has jammed."))
            } else {
                var result = target.kill(false, this.name);
                if(result[0]) {
                    this.removeItem("Gun")
                    gblMessageManager.push(new Message("!GameLog", this.name + "'s shoots and kills "+ target.getName +"."))
                    var deaths = gblActionManager.filter((act) => act.getName === "Death");
                    for(var i=0; i<deaths.length; i++){ 
                        deaths[i].runAction()
                        gblActionManager.remove(deaths[i])
                    }
                } else {
                    this.removeItem("Gun")
                    gblMessageManager.push(new Message("!GMAction", "-> Declare that "+ target.getName +" is saved by their Armour."))
                    gblMessageManager.push(new Message("!GameLog", this.name + "'s shoots "+ target.getName + result[1]))
                }
            }
            gblMessageManager.draw()
            clearLists()
            for(var key in gblPlayerDictionary) gblPlayerDictionary[key].draw()
            var div = select.parentElement;
            div.removeChild(div.lastChild)
            div.removeChild(div.lastChild)
        }
        entry.appendChild(fireButton);
    }
    drawNight(){
        if(!this.alive){
            var entry = document.createElement('li');
            entry.className = "lir Dead";
            // push name to entry
            var name = document.createElement('div');
            name.className = "list-name";
            name.innerText = this.name;
            entry.appendChild(name);
            var role = document.createElement('div');
            role.className = "list-role";
            role.innerText = ":" + this.role;
            entry.appendChild(role);
            document.getElementById("DeadListID").appendChild(entry)
            return
        }
        var olTarget = document.getElementById(this.alignment[0] + "ListID")
        // create li box
        var entry = document.createElement('li');
        entry.className = "lir " + this.alignment[0];
        // push name to entry
        var name = document.createElement('div');
        name.className = "list-name";
        name.innerText = this.name === "!Mafia" || this.name === "!MafiaDouble" ? "" : this.name;
        entry.appendChild(name);
        // push role to entry
        var role = document.createElement('div');
        role.className = "list-role";
        role.innerText = ":" + this.role;
        entry.appendChild(role);
        // create action div
        var actionDiv = document.createElement('div');
        actionDiv.className = "action-div";
        entry.appendChild(actionDiv)
        // create role action select
        var actionSelect = document.createElement('select');
        actionSelect.className = "form select ac-ico";
        actionSelect.id = this.name + "ACID";
        actionSelect.style.display = "none";
        actionSelect.onchange = () => {
            var elem = document.getElementById(this.name + "ACID");
            var menus = document.getElementsByName(this.name + "TGID");
            menus[0].style.display = "none";
            menus[1].style.display = "none";
            if(elem.value !== "No Action") this.actions.returnContains(elem.value).calcTarget();
        }
        actionDiv.appendChild(actionSelect)
        // create report select
        var reportSelect = document.createElement('select');
        reportSelect.className = "form select rp-ico";
        reportSelect.id = this.name + "RPID";
        reportSelect.style.display = "none";
        actionDiv.appendChild(reportSelect)
        // create target[0] select
        var targetSelect = document.createElement('select');
        targetSelect.className = "form select tg-ico";
        targetSelect.name = this.name + "TGID";
        targetSelect.style.display = "none"
        entry.appendChild(targetSelect)
        // create target[1] select
        var targetSelect2 = document.createElement('select');
        targetSelect2.className = "form select tg-ico";
        targetSelect2.name = this.name + "TGID";
        targetSelect2.style.display = "none"
        entry.appendChild(targetSelect2)
        // push to ol

        if(process.env.NODE_ENV != 'production'){////////////////////////////////////////////////////////////////////////////////
            var testbtn  = document.createElement('button');
            testbtn.innerText = "rand targs";
            testbtn.onclick = () => {
                var selects = document.getElementsByName(this.name + "TGID");
                selects[0].selectedIndex = Math.floor(Math.random() * selects[0].length);
                selects[1].selectedIndex = Math.floor(Math.random() * selects[1].length);
            };
            entry.appendChild(testbtn);
        }////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        olTarget.appendChild(entry)
        // proceed to draw actions
        this.drawActions()
        this.drawReport()
    }
    drawActions(){   
        //check for actions
        if(this.actions.length > 0){
            var select = document.getElementById(this.name + "ACID");
            select.style.display = "";
            // wipe select
            while (select.firstChild) select.removeChild(select.firstChild);
            select.options.add(new Option("No Action"))
            //make sure theres only 1 of each type of action shown
            var dupes = [];
            for(var i=0; i<this.actions.length; i++){
                if(this.actions[i].getSelectable && !dupes.includes(this.actions[i].getName)){
                    select.options.add(new Option(this.actions[i].getName))
                }
                dupes.push(this.actions[i].getName)
            }
            if(this.items.includes("Evidence")) select.options.add(new Option("Pass Evidence"))
            if(this.items.includes("Moonshine")) select.options.add(new Option("Pass Moonshine"))
            if(select.options.length < 2){ select.style.display = "none"; }
            else select.selectedIndex = 0;
        }
    }
    drawReport(){
        //check for report
        if(this.items.includes("Report") && !this.getSabotage){
            var select = document.getElementById(this.name + "RPID");
            select.style.display = "";
            var tl = gblPlayerList.returnTargetList(this.name)

            for(var i=0; i<tl.length; i++){ select.options[i] = null; }
            select.options.add(new Option("No Report"))
            for(var i=0; i<tl.length; i++){ select.options.add(new Option(tl[i])); }
        }
    }
    drawGun(){
        if(!this.items.includes("Gun")) return

        var dest = document.getElementById("DeadListID")
        var entry = document.createElement('li');
        entry.className = "lis glBorder";
        var name = document.createElement('div');
        name.className = "list-return";
        name.innerText = this.name + " uses their gun on:";
        entry.appendChild(name);

        var targSelect = document.createElement('select');
        targSelect.className = "form select tg-ico mrlp5";
        var tl = gblPlayerList.returnTargetList(this.name)
        for(var i=0; i<tl.length; i++){ targSelect.add(new Option(tl[i])); }
        targSelect.selectedIndex = 0;
        entry.appendChild(targSelect)

        var fireButton = document.createElement('button');
        fireButton.className = "btn btn-run mrlp5";
        fireButton.innerText = "Fire!";
        fireButton.onclick = function() { 
            var div = this.parentElement;
            var killer = gblPlayerDictionary[div.children[0].innerText.split(" ")[0]];
            var target = gblPlayerDictionary[div.children[1].value];

            if(killer.getSabotage){
                div.firstChild.className = "list-return text-Red";
                div.firstChild.innerText = killer.getName + "'s gun has jammed.";
            } else {
                var result = target.kill(false, killer.getName);
                if(result[0]) {
                    div.firstChild.className = "list-return text-White";
                    div.firstChild.innerText = "-> Declare "+ target.getName +" dead.";
                    killer.removeItem("Gun")
                    gblMessageManager.push(new Message("!GameLog", killer.getName + "'s shoots and kills "+ target.getName +"."))

                    var deaths = gblActionManager.filter((act) => act.getName === "Death");
                    for(var i=0; i<deaths.length; i++){ 
                        deaths[i].runAction()
                        gblActionManager.remove(deaths[i])
                    }
                    gblMessageManager.removeDead = target.getName;
                    renderMessages()
                } else {
                    div.firstChild.className = "list-return text-Green";
                    div.firstChild.innerText = target.getName +" is saved by their Armour.";
                    killer.removeItem("Gun")
                    gblMessageManager.push(new Message("!GameLog", killer.getName + "'s shoots "+ target.getName + result[1]))
                }
            }
            div.removeChild(div.lastChild)
            div.removeChild(div.lastChild)
            var removeButton = document.createElement('button');
            removeButton.className = "btn btn-remove mrlp5";
            removeButton.innerText = "Remove";
            removeButton.onclick = function() { this.parentElement.remove() }
            div.appendChild(removeButton);
        }
        entry.appendChild(fireButton);
        dest.appendChild(entry);
    }
}

class MafiaKill extends Player {
    constructor(name) {
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Mafia Kill";
    }
    init() { 
        //give inital action
        this.actions.push(new Kill(this.name, this.role))
    }
    eventScan() {
        if(this.actions.contains("Mafia Kill")) return
        this.actions.push(new Kill(this.name, this.role))
    }
    drawActions() {   
        var select = document.getElementById(this.name +"ACID");
        select.className = "form select mk-ico";
        select.style.display = "";
        select.onchange = () => {
            if(select.value !== "No Action") {
                this.actions[0].calcTarget(); 
            } else {
                var menus = document.getElementsByName(this.name +"TGID");
                menus[0].style.display = "none";
                menus[1].style.display = "none";
            }
        }
        while (select.firstChild) { select.removeChild(select.firstChild) }
        select.options.add(new Option("No Action"))
        for(var key in gblPlayerDictionary) {
            if(gblPlayerDictionary[key].getAlign === "Mafia") {
                select.options.add(new Option(key))
            }
        }
        select.selectedIndex = 0; 
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////// Villagers
const nsRoles = {
"Baker": class Baker extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Baker";
        this.roleReport = "can give items.";
    }
    // Overrides
    set setAlive(bool){ 
        this.alive = bool;
        if(bool) return
        var sList = gblActionManager.filter((act) => act.getName === "Soul Link");
        var i = sList.length;
        while (i--) { 
            if(sList[i].getOwner === this.name || sList[i].getTarget === this.name) sList[i].trigger() 
        }
        this.deathCycle = gblGameCycles;
        this.actions.removeToOther("Famine", gblActionManager)
        gblMessageManager.push(new Message("!GMAction", "-> Declare that a famine has begun."))
        gblMessageManager.push(new Message("!GameLog", this.name + "'s death has caused a famine."))
        gblMessageManager.setDead = this.name;
        }
    lynch(){ 
        this.alive = false;
        var famine = this.actions.returnContains("Famine");
        famine.setDelay = 3;
        this.actions.removeToOther(famine, gblActionManager)
        gblMessageManager.push(new Message("!GMAction", "-> Declare that a famine has begun."))
        gblMessageManager.push(new Message("!GameLog", this.name + " was lynched by the village, a famine has begun."))
    }

    init(){ 
        //give inital action
        this.actions.push(new MiscEvent(this.name));
        this.actions.push(new GiveItem(this.name))
    }
    eventScan(){
        if(this.actions.contains("Give Bread")) return
        this.actions.push(new GiveItem(this.name))
    }
}, 

"Barkeep": class Barkeep extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Barkeep";
        this.roleReport = "can affect identity.";
    }
    // Overrides
    set addArrival(arrival){
        gblMessageManager.push(new Message(arrival, "You visited the friendly Barkeep :beers:."));
        (this.arrivals[gblGameCycles] || (this.arrivals[gblGameCycles] = [])).push(arrival)
    }
}, 

"Blacksmith": class Blacksmith extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Blacksmith";
        this.roleReport = "can give items.";
    }
    init(){ 
        //give inital action
        var ta = gblPlayerList.clone().remove(this.name)
        for(var i=0; i<ta.length; i++){ 
            var x = new GiveItem(this.name);
            x.setTarget = ta[i];
            this.actions.push(x)
        }
    }
    actionTransfer(action){
        if(action.getName === "Give Armour"){
            var target = document.getElementsByName(action.getOwner + "TGID")[0].value;
            var action = this.actions.find((act) => act.getTarget === target)
            this.actions.removeToOther(action, gblActionManager)
        } else { this.actions.removeToOther(action, gblActionManager) }
    }
}, 

"Bodyguard": class Bodyguard extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Bodyguard";
        this.roleReport = "can block actions and protect a player.";
    }
    init(){ 
        this.actions.push(new Protect(this.name))
    }
    eventScan(){
        if(this.actions.contains("Protect")) return
        this.actions.push(new Protect(this.name))
    }
},

"Comedian": class Comedian extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village", "Mafia"];
        this.role = "Comedian";
        this.roleReport = "can affect identity.";
    }
    reset(){
        while(this.alignment.length > 2) { this.alignment.pop() }
        if(this.protection.includes("Armour")) this.removeItem("Armour")
        if(this.items.includes("Evidence")){
            if(!this.actions.contains("Pass Evidence")) this.actions.push(new PassItem(this.name, "Evidence"))
        } else {
            if(this.actions.contains("Pass Evidence")) this.actions.remove(this.actions.filter((act) => act.getName === "Pass Evidence"))
        }
        if(this.items.includes("Moonshine")){
            if(!this.actions.contains("Pass Moonshine")) this.actions.push(new PassItem(this.name, "Moonshine"))
        } else {
            if(this.actions.contains("Pass Moonshine")) this.actions.remove(this.actions.filter((act) => act.getName === "Pass Moonshine"))
        }
        this.blocked = [];
        this.protection = [];
        this.eventScan()
    }
},

"Commuter": class Commuter extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Commuter";
        this.roleReport = "can protect themselves.";
    }
    init(){ 
        this.actions.push(new Commute(this.name))
        this.actions.push(new Commute(this.name))
    }
},

"Cop": class Cop extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Cop";
        this.roleReport = "can investigate a player.";
    }
    set setAlive(bool){ 
        this.alive = bool;
        if(bool) return
        var sList = gblActionManager.filter((act) => act.getName === "Soul Link");
        var i = sList.length;
        while (i--) { 
            if(sList[i].getOwner === this.name || sList[i].getTarget === this.name) sList[i].trigger() 
        }
        this.deathCycle = gblGameCycles;
        this.actions.removeToOther("Pass Cop", gblActionManager)
        gblMessageManager.push(new Message("!GameLog", this.name + " dies giving their role up to a Deputy."))
        gblMessageManager.setDead = this.name;
        }
    lynch(){ 
        this.alive = false;
        var action = this.actions.returnContains("Pass Cop");
        action.setDelay = 0;
        this.actions.removeToOther(action, gblActionManager)
        gblMessageManager.push(new Message("!GameLog", this.name + " was lynched by the village, giving their role up to a Deputy."))
    }

    init(){ 
        this.actions.push(new MiscEvent(this.name));
        this.actions.push(new Investigate(this.name))
    }
    eventScan(){
        if(this.actions.contains("Investigate")) return
        this.actions.push(new Investigate(this.name))
    }
},

"Coroner": class Coroner extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Coroner";
        this.roleReport = "can investigate a player.";
    }
    init(){ 
        this.actions.push(new Investigate(this.name))
    }
    drawActions(){   
        //check for actions
        if(this.actions.length > 0){
            var select = document.getElementById(this.name + "ACID");
            select.style.display = "";
            // wipe select
            while (select.firstChild) { 
                select.removeChild(select.firstChild); 
            }
            select.options.add(new Option("No Action"))
            var dupes = [];
            if(this.actions.contains("Inspect Death") && gblPlayerList.returnDeadList().length > 1) {
                select.options.add(new Option("Inspect Death"))
                dupes.push("Inspect Death")
            }
            //make sure theres only 1 of each type of action shown
            for(var i=0; i<this.actions.length; i++){
                var name = this.actions[i].getName;
                if(this.actions[i].getSelectable && !dupes.includes(name) && name !== "Inspect Death") {
                    select.options.add(new Option(name))
                }
                dupes.push(name)
            }
            if(this.items.includes("Evidence")) select.options.add(new Option("Pass Evidence"))
            if(this.items.includes("Moonshine")) select.options.add(new Option("Pass Moonshine"))
            if(select.options.length < 2){ select.style.display = "none"; }
            else select.selectedIndex = 0;
        }
    }
},

"Deputy": class Deputy extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Deputy";
        this.roleReport = "can change roles.";
    }
    init(){ 
        this.actions.push(new Investigate(this.name))
    }
},

"Detective": class Detective extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Detective";
        this.roleReport = "can investigate a player.";
    }
    init(){ 
        this.actions.push(new Investigate(this.name))
    }
    eventScan(){
        if(this.actions.contains("Investigate")) return
        this.actions.push(new Investigate(this.name))
    }
},

"Doctor": class Doctor extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Doctor";
        this.roleReport = "can protect a player.";
    }
    set setAlive(bool){ 
        this.alive = bool;
        if(bool) return
        var sList = gblActionManager.filter((act) => act.getName === "Soul Link");
        var i = sList.length;
        while (i--) { 
            if(sList[i].getOwner === this.name || sList[i].getTarget === this.name) sList[i].trigger() 
        }
        this.deathCycle = gblGameCycles;
        this.actions.removeToOther("Pass Doctor", gblActionManager)
        gblMessageManager.push(new Message("!GameLog", this.name + " dies giving their role up to a Nurse."))
        gblMessageManager.setDead = this.name;
        }
    lynch(){ 
        this.alive = false;
        var action = this.actions.returnContains("Pass Doctor");
        action.setDelay = 0;
        this.actions.removeToOther(action, gblActionManager)
        gblMessageManager.push(new Message("!GameLog", this.name + " was lynched by the village, giving their role up to a Nurse."))
    }

    init(){ 
        this.actions.push(new Protect(this.name))
        this.actions.push(new MiscEvent(this.name));
        var self = new Protect(this.name)
        self.setName = "Protect Self";
        self.setTarget = this.name;
        self.setVisit = false;
        self.setType = 0;
        this.actions.push(self)
    }
    eventScan(){
        if(this.actions.contains("Protect")) return
        this.actions.push(new Protect(this.name))
    }
},

"Driver": class Driver extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Driver";
        this.roleReport = "can redirect visits.";
    }
    init(){ 
        this.actions.push(new Reroute(this.name))
    }
    eventScan(){
        if(this.actions.contains("Drive")) return
        this.actions.push(new Reroute(this.name))
    }
},

"Farmer": class Farmer extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Farmer";
        this.roleReport = "can kill a player.";
    }
    init(){ 
        var act = new Death(this.name);
        act.setName = "Shoot Trespasser";
        this.actions.push(act)
    }
    set addArrival(arrival){
        var action = null;
        if(action = this.actions.returnContains("Shoot Trespasser")) {
            action.setTarget = arrival;
            this.actions.removeToOther(action, gblActionManager)
            gblMessageManager.push(new Message("!GameLog", this.name + " shot " + arrival + " for tresspassing on his land."))
        }
        (this.arrivals[gblGameCycles] || (this.arrivals[gblGameCycles] = [])).push(arrival)
    }
},

"Govenor": class Govenor extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Govenor";
        this.roleReport = "can affect a vote.";
    }
    init(){
        gblMessageManager.push(new Message(this.name, "You are the Govenor. To use your veto, tell the GM via DM after the vote\n"+
                                                    "counting stage of a Lynch. A veto called for verbally will not be recognised."))
    }
},

"Gunsmith": class Gunsmith extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Gunsmith";
        this.roleReport = "can give items.";
    }
    init(){ 
        //give inital action
        this.actions.push(new GiveItem(this.name))
    }
    eventScan(){
        if(this.actions.contains("Give Gun")) return
        this.actions.push(new GiveItem(this.name))
    }
},

"Hunter": class Hunter extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Hunter";
        this.roleReport = "has lynch consquences.";
    }
    lynch(){ 
        this.alive = false;
        // build kill on lynch
        var entry = document.createElement('li');
        document.getElementById("messageListID").appendChild(entry)
        entry.className = "lis glBorder";
        var name = document.createElement('div');
        entry.appendChild(name);
        name.className = "list-return";
        name.innerText = this.name + "'s attempts to kill:";

        var targSelect = document.createElement('select');
        entry.appendChild(targSelect)
        targSelect.className = "form select tg-ico mrlp5";
        targSelect.id = this.name +"HCID"
        var tl = gblPlayerList.returnTargetList(this.name)
        targSelect.add(new Option("Nobody"))
        for(var i=0; i<tl.length; i++){ targSelect.add(new Option(tl[i])); }
        targSelect.selectedIndex = 0;

        var fireButton = document.createElement('button');
        entry.appendChild(fireButton)
        fireButton.className = "btn btn-run mrlp5";
        fireButton.innerText = "Kill";
        fireButton.onclick = () => { 
            var select = document.getElementById(this.name +"HCID");
            var target = gblPlayerDictionary[select.value];
            var result = target.kill(false, this.name);
            if(result[0]) {
                gblMessageManager.push(new Message("!GameLog", this.name + "'s shoots and kills "+ target.getName +"."))
                var deaths = gblActionManager.filter((act) => act.getName === "Death");
                for(var i=0; i<deaths.length; i++){ 
                    deaths[i].runAction()
                    gblActionManager.remove(deaths[i])
                }
            } else {
                gblMessageManager.push(new Message("!GMAction", "-> Declare that "+ target.getName +" survived the attack."))
                gblMessageManager.push(new Message("!GameLog", this.name + "'s shoots "+ target.getName + result[1]))
            }
            gblMessageManager.draw()
            clearLists()
            for(var key in gblPlayerDictionary) gblPlayerDictionary[key].draw()
            select.parentElement.remove();
        }
    }
},

"Innocent Child": class InnocentChild extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Innocent Child";
        this.roleReport = "can affect identity.";
    }
    init(){
        gblMessageManager.push(new Message(this.name, "You are the Innocent Child, you may reveal your role once per game.\n"+
                                        "Please do not drag the role card out of your hand, just say that you wish to reveal.\n"+
                                        "If you cannot do this due to being silenced, you may inform the GM privately to reveal."))
    }
},

"Jack-of-all-trades": class Jackofalltrades extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Jack-of-all-trades";
        this.roleReport = "can do many things.";
    }
    init(){
        this.actions.push(new Protect(this.name))
        this.actions.push(new Investigate(this.name))
        this.actions.push(new Kill(this.name))
    }
},

"Jailor": class Jailor extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Jailor";
        this.roleReport = "can block actions and protect a player.";
    }
    init(){
        this.actions.push(new Block(this.name))
    }
    eventScan(){
        if(this.actions.contains("Jail")) return
        this.actions.push(new Block(this.name))
    }
},

"Mayor": class Mayor extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Mayor";
        this.roleReport = "can affect a vote.";
    }
},

"Neighbour": class Neighbour extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Neighbour";
        this.roleReport = "can affect identity.";
    }
    init(){
        this.actions.push(new GiveItem(this.name))
    }
},

"Nurse": class Nurse extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Nurse";
        this.roleReport = "can change roles.";
    }
    init(){
        this.actions.push(new Protect(this.name))
    }
},

"Postman": class Postman extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Postman";
        this.roleReport = "can give items.";
    }
    init(){ 
        //give inital action
        this.actions.push(new GiveItem(this.name))
    }
    eventScan(){
        if(this.actions.contains("Give Item")) return
        this.actions.push(new GiveItem(this.name))
    }
},

"Priest": class Priest extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Priest";
        this.roleReport = "has consequences if they die.";
    }
    set setAlive(bool) { 
        this.alive = bool;
        if(bool) return
        var sList = gblActionManager.filter((act) => act.getName === "Soul Link");
        var i = sList.length;
        while (i--) { 
            if(sList[i].getOwner === this.name || sList[i].getTarget === this.name) sList[i].trigger() 
        }
        this.deathCycle = gblGameCycles;
        var lastvisit = "";
        var j = gblGameCycles;
        while (j--) {
            if(this.departure[j]) { lastvisit = this.departure[j].toOrderedString(); break; }
        }
        var reveal = lastvisit !== "" ? lastvisit +" as the "+ gblPlayerDictionary[lastvisit].getRole +"." : "nobody.";
        gblMessageManager.push(new Message("!GameLog", this.name +" died revealing "+ reveal))
        gblMessageManager.setDead = this.name;
        }
    lynch() { 
        this.alive = false;
        var lastvisit = "";
        var j = gblGameCycles;
        while (j--) {
            if(this.departure[j]) { lastvisit = this.departure[j].toOrderedString(); break; }
        }
        var reveal = lastvisit !== "" ? lastvisit +" as the "+ gblPlayerDictionary[lastvisit].getRole +"." : "nobody.";
        gblMessageManager.push(new Message("!GMAction", "-> Declare that "+ this.name +" was found dead. Their death reveals "+ reveal))
        gblMessageManager.push(new Message("!GameLog", this.name +" died revealing "+ reveal))
    }

    init(){ 
        //give inital action
        this.actions.push(new Investigate(this.name))
    }
    eventScan(){
        if(this.actions.contains("Visit")) return
        this.actions.push(new Investigate(this.name))
    }
},

"Reporter": class Reporter extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Reporter";
        this.roleReport = "can give items.";
    }
    init(){ 
        //give inital action
        this.actions.push(new GiveItem(this.name))
    }
    eventScan(){
        if(this.actions.contains("Give Report")) return
        this.actions.push(new GiveItem(this.name))
    }
},

"Sidekick": class Sidekick extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Sidekick";
        this.roleReport = "can change roles.";
    }
    init(){ 
        gblActionManager.push(new Protect(this.name))
    }
},

"Town Drunk": class TownDrunk extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Town Drunk";
        this.roleReport = "can block actions.";
    }
    init(){ 
        //give inital action
        this.actions.push(new Block(this.name))
    }
    eventScan(){
        if(this.actions.contains("Block")) return
        this.actions.push(new Block(this.name))
    }
},

"Tracker": class Tracker extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Tracker";
        this.roleReport = "can investigate a player.";
    }
    init(){ 
        //give inital action
        this.actions.push(new Investigate(this.name))
    }
    eventScan(){
        if(this.actions.contains("Track")) return
        this.actions.push(new Investigate(this.name))
    }
},

"Veteran": class Veteran extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Veteran";
        this.roleReport = "can protect themselves.";
    }
    init(){ 
        gblActionManager.push(new Protect(this.name))
    }
},

"Vigilante": class Vigilante extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Vigilante";
        this.roleReport = "can kill a player.";
    }
    set setAlive(bool) { 
        this.alive = bool;
        if(bool) return
        var sList = gblActionManager.filter((act) => act.getName === "Soul Link");
        var i = sList.length;
        while (i--) { 
            if(sList[i].getOwner === this.name || sList[i].getTarget === this.name) sList[i].trigger() 
        }
        this.deathCycle = gblGameCycles;
        this.actions.removeToOther("Pass Vigilante", gblActionManager)
        gblMessageManager.push(new Message("!GameLog", this.name + " dies giving their role up to a Sidekick."))
        gblMessageManager.setDead = this.name;
        }
    lynch(){ 
        this.alive = false;
        var action = this.actions.returnContains("Pass Vigilante");
        action.setDelay = 0;
        this.actions.removeToOther("Pass Vigilante", gblActionManager)
        gblMessageManager.push(new Message("!GameLog", this.name + " was lynched by the village, giving their role up to a Sidekick."))
    }

    init(){ 
        //give inital action
        this.actions.push(new MiscEvent(this.name));
        this.actions.push(new Kill(this.name))
    }
    eventScan(){
        if(this.actions.contains("Kill")) return
        this.actions.push(new Kill(this.name))
    }
},

"Virgin": class Virgin extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Virgin";
        this.roleReport = "has lynch consquences.";
    }
    init(){ 
        //give inital action
        this.actions.push(new Block(this.name))
    }
},

"Watcher": class Watcher extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Village"];
        this.role = "Watcher";
        this.roleReport = "can investigate a player.";
    }
    init(){ 
        //give inital action
        this.actions.push(new Investigate(this.name))
    }
    eventScan(){
        if(this.actions.contains("Watch")) return
        this.actions.push(new Investigate(this.name))
    }
},

////////////////////////////////////////////////////////////////////////////////////////////////////////// Mafia

"Apprentice": class Apprentice extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia", "Village"];
        this.role = "Apprentice";
        this.roleReport = "can change roles.";
    }
    reset(){
        while(this.alignment.length > 2) { this.alignment.pop() }
        if(this.protection.includes("Armour")) this.removeItem("Armour")
        if(this.items.includes("Evidence")){
            if(!this.actions.contains("Pass Evidence")) this.actions.push(new PassItem(this.name, "Evidence"))
        } else {
            if(this.actions.contains("Pass Evidence")) this.actions.remove(this.actions.filter((act) => act.getName === "Pass Evidence"))
        }
        if(this.items.includes("Moonshine")){
            if(!this.actions.contains("Pass Moonshine")) this.actions.push(new PassItem(this.name, "Moonshine"))
        } else {
            if(this.actions.contains("Pass Moonshine")) this.actions.remove(this.actions.filter((act) => act.getName === "Pass Moonshine"))
        }
        this.blocked = [];
        this.protection = [];
        this.eventScan()
    }
    eventScan(){
        var checkDead = [];
        for(var key in gblPlayerDictionary) {
            if(!gblPlayerDictionary[key].getAlive && 
                gblPlayerDictionary[key].getAlign === "Mafia") {
                checkDead.push(gblPlayerDictionary[key])
            }
        }
        if(checkDead.length > 0){
            var l = Math.floor(Math.random() * checkDead.length);
            var r = checkDead[l].getRole;
            gblMessageManager.push(new Message(this.name, "Your role is now: " + r))
            gblMessageManager.push(new Message("!GameLog", this.name + " has assumed " + checkDead[l].getName + "'s role."))
            gblPlayerDictionary[this.name] = new nsRoles[r](this.name);
        }
    }
},

"Bookie": class Bookie extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Bookie";
        this.roleReport = "has lynch consquences.";
        this.BookSuccess = false;
        this.BookCycle = 0;
    }
    get getBookSuccess() { return this.BookSuccess }
    get getBookCycle() { return this.BookCycle }
    set setBooking(cycle) {
        this.BookCycle = cycle;
        this.BookSuccess = true;
    }
    init(){ 
        //give inital action
        this.actions.push(new MiscEvent(this.name))
    }
    eventScan(){
        if(this.BookSuccess && this.actions.contains("Book")) return
        this.actions.push(new MiscEvent(this.name))
    }
},

"Bouncer": class Bouncer extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Bouncer";
        this.roleReport = "can block actions and protect a player.";
    }
    init(){ 
        this.actions.push(new Protect(this.name))
    }
    eventScan(){
        if(this.actions.contains("Protect")) return
        this.actions.push(new Protect(this.name))
    }
},

"Chauffeur": class Chauffeur extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Chauffeur";
        this.roleReport = "can redirect visits.";
    }
    init(){ 
        this.actions.push(new Reroute(this.name))
    }
    eventScan(){
        if(this.actions.contains("Chauffeur")) return
        this.actions.push(new Reroute(this.name))
    }
},

"Framer": class Framer extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Framer";
        this.roleReport = "can affect identity.";
    }
    init(){ 
        this.actions.push(new AlignMask(this.name))
    }
    eventScan(){
        if(this.actions.contains("Frame")) return
        this.actions.push(new AlignMask(this.name))
    }
},

"Godfather": class Godfather extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia", "Village"];
        this.role = "Godfather";
        this.roleReport = "can affect identity.";
    }
    reset(){
        while(this.alignment.length > 2) { this.alignment.pop() }
        if(this.protection.includes("Armour")) this.removeItem("Armour")
        if(this.items.includes("Evidence")){
            if(!this.actions.contains("Pass Evidence")) this.actions.push(new PassItem(this.name, "Evidence"))
        } else {
            if(this.actions.contains("Pass Evidence")) this.actions.remove(this.actions.filter((act) => act.getName === "Pass Evidence"))
        }
        if(this.items.includes("Moonshine")){
            if(!this.actions.contains("Pass Moonshine")) this.actions.push(new PassItem(this.name, "Moonshine"))
        } else {
            if(this.actions.contains("Pass Moonshine")) this.actions.remove(this.actions.filter((act) => act.getName === "Pass Moonshine"))
        }
        this.blocked = [];
        this.protection = [];
        this.eventScan()
    }
},

"Hooker": class Hooker extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Hooker";
        this.roleReport = "can block actions.";
    }
    init(){ 
        //give inital action
        this.actions.push(new Block(this.name))
    }
    eventScan(){
        if(this.actions.contains("Block")) return
        this.actions.push(new Block(this.name))
    }
},

"Janitor": class Janitor extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Janitor";
        this.roleReport = "can investigate a player.";
    }
    init(){ 
        //give inital action
        this.actions.push(new MiscEvent(this.name))
    }
},

"Lawyer": class Lawyer extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Lawyer";
        this.roleReport = "can block actions.";
    }
    init(){ 
        //give inital action
        this.actions.push(new Block(this.name))
    }
    eventScan(){
        if(this.actions.contains("Lawyer")) return
        this.actions.push(new Block(this.name))
    }
},

"Ninja": class Ninja extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Ninja";
        this.roleReport = "can protect themselves.";
    }
},

"Poisoner": class Poisoner extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Poisoner";
        this.roleReport = "can kill a player.";
    }
    init(){ 
        //give inital action
        this.actions.push(new GiveItem(this.name))
    }
},

"Politician": class Politician extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Politician";
        this.roleReport = "can block actions.";
    }
    init(){ 
        //give inital action
        this.actions.push(new Block(this.name))
    }
},

"Saboteur": class Saboteur extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Saboteur";
        this.roleReport = "can block actions.";
    }
    init(){ 
        //give inital action
        this.actions.push(new Block(this.name))
    }
    eventScan(){
        if(this.actions.contains("Sabotage")) return
        this.actions.push(new Block(this.name))
    }
},

"Silencer": class Silencer extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Silencer";
        this.roleReport = "can block actions.";
    }
    init(){ 
        //give inital action
        this.actions.push(new GiveItem(this.name))
    }
    eventScan(){
        if(this.actions.contains("Silence")) return
        this.actions.push(new GiveItem(this.name))
    }
},

"Spy": class Spy extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Spy";
        this.roleReport = "can investigate a player.";
    }
    init(){ 
        //give inital action
        this.actions.push(new Investigate(this.name))
    }
    eventScan(){
        if(this.actions.contains("Investigate")) return
        this.actions.push(new Investigate(this.name))
    }
},

"Strongman": class Strongman extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Strongman";
        this.roleReport = "can kill a player.";
    }
    init(){ 
        //give inital action
        this.actions.push(new MiscEvent(this.name))
    }
},

"Tailor": class Tailor extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Tailor";
        this.roleReport = "can affect identity.";
    }
    init(){ 
        //give inital action
        this.actions.push(new AlignMask(this.name))
    }
    eventScan(){
        if(this.actions.contains("Tailor")) return
        this.actions.push(new AlignMask(this.name))
    }
},

"Thief": class Thief extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Mafia"];
        this.role = "Thief";
        this.roleReport = "can give items.";
    }
    init(){ 
        this.actions.push(new Reroute(this.name))
    }
    eventScan(){
        if(this.actions.contains("Thief")) return
        this.actions.push(new Reroute(this.name))
    }
},

////////////////////////////////////////////////////////////////////////////////////////////////////////// 3rd Party

"Amnesiac": class Amnesiac extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Amnesiac";
        this.roleReport = "can change roles.";
    }
    init(){ 
        this.actions.push(new MiscEvent(this.name))
    }
    drawActions(){
        //check for actions
        if(this.actions.length > 0) {
            var select = document.getElementById(this.name + "ACID");
            select.style.display = "";
            // wipe select
            while (select.firstChild) { 
                select.removeChild(select.firstChild); 
            }
            select.options.add(new Option("No Action"))
            var dupes = [];
            if(this.actions.contains("Choose Role") && gblPlayerList.returnDeadList().length > 1) {
                select.options.add(new Option("Choose Role"))
                dupes.push("Choose Role")
            }
            //make sure theres only 1 of each type of action shown
            for(var i=0; i<this.actions.length; i++){
                var name = this.actions[i].getName;
                if(this.actions[i].getSelectable && !dupes.includes(name) && name !== "Choose Role") {
                    select.options.add(new Option(name))
                }
                dupes.push(name)
            }
            if(this.items.includes("Evidence")) select.options.add(new Option("Pass Evidence"))
            if(this.items.includes("Moonshine")) select.options.add(new Option("Pass Moonshine"))
            if(select.options.length < 2){ select.style.display = "none"; }
            else select.selectedIndex = 0;
        }
    }
},

"Arsonist": class Arsonist extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Arsonist";
        this.roleReport = "can kill a player.";
    }
    init(){ 
        this.actions.push(new GiveItem(this.name))
        this.actions.push(new Kill(this.name))
    }
    eventScan(){
        if(this.actions.contains("Douse")) return
        this.actions.push(new GiveItem(this.name))
        if(this.actions.contains("Ignite")) return
        this.actions.push(new Kill(this.name))
    }
},

"Blackmailed": class Blackmailed extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Blackmailed";
        this.roleReport = "can kill a player.";
    }
    init(){ 
        this.actions.push(new Kill(this.name))
        gblActionManager.push(new PassItem(this.name, "EvidenceSpawn"))
    }
    eventScan(){
        if(this.actions.contains("Hunt Item")) return
        this.actions.push(new Kill(this.name))
    }
},

"Bootlegger": class Bootlegger extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Bootlegger";
        this.roleReport = "can give items.";
    }
    init(){ 
        this.actions.push(new GiveItem(this.name))
    }
    eventScan(){
        if(this.actions.contains("Give Moonshine")) return
        this.actions.push(new GiveItem(this.name))
    }
    set setAlive(bool){ 
        this.alive = bool;
        if(bool) return
        var sList = gblActionManager.filter((act) => act.getName === "Soul Link");
        var i = sList.length;
        while (i--) { 
            if(sList[i].getOwner === this.name || sList[i].getTarget === this.name) sList[i].trigger() 
        }
        for(var key in gblPlayerDictionary){
            if(gblPlayerDictionary[key].getName !== this.name && gblPlayerDictionary[key].getItems.includes("Moonshine")) {
                gblActionManager.push(new Death("", key))
                gblMessageManager.push(new Message("!GameLog", key +" died from alcohol poisoning on "+ this.name +"'s death."))
            }
        }
        this.deathCycle = gblGameCycles;
        gblMessageManager.setDead = this.name;
    }
},

"Cult Leader": class CultLeader extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Cult"];
        this.role = "Cult Leader";
        this.roleReport = "can change roles.";
    }
    init(){ 
        this.actions.push(new AlignMask(this.name))
    }
    eventScan(){
        if(this.actions.contains("Convert")) return
        this.actions.push(new AlignMask(this.name))
    }
},

"Cultist": class Cultist extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Cult"];
        this.role = "Cultist";
        this.roleReport = "can affect identity.";
    }
},

"Fool": class Fool extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Fool";
        this.roleReport = "has lynch consquences.";
    }
},

"Hypnotist": class Hypnotist extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Hypnotist";
        this.roleReport = "can redirect visits.";
    }
    init(){ 
        this.actions.push(new Reroute(this.name))
    }
    eventScan(){
        if(this.actions.contains("Hypnotise")) return
        this.actions.push(new Reroute(this.name))
    }
},

"Lover": class Lover extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Lover";
        this.roleReport = "has consequences if they die.";
    }
    init(){ 
        var plist = gblPlayerList.returnTargetList(this.name);
        var soulmate = plist[Math.floor(Math.random() * plist.length)];
        gblActionManager.push(new SoulLink(this.name, soulmate))
        gblMessageManager.push(new Message("!GameLog", this.name + " and " + soulmate + " are lovers."))
        gblMessageManager.push(new Message("!GMAction", "-> Open a chat group containing: " + this.name + " and " + soulmate +
                                                ".\n-> Paste the message below into the new chat: ",
                                                ":rose: **SOULMATES** :rose:\n"+
                                                "--------------------------------------------\n"+
                                                "**"+ this.name +"** :heart: **"+ soulmate +"**\n"+
                                                "--------------------------------------------\n"+
                                                "Your fates are now linked, if one of you\n"+
                                                "were to die. The other will also die.\n\n"+     
                                                "If you are both the only villagers left\n"+
                                                "alive you will both win the game.\n"+
                                                "--------------------------------------------"))
    }
},

"Lyncher": class Lyncher extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Lyncher";
        this.roleReport = "has lynch consquences.";
        this.target = "";
    }
    init(){
        var list = gblPlayerList.clone().remove(this.name);
        for(var key in gblPlayerDictionary){
            if(gblPlayerDictionary[key].getAlign === "Mafia"){ list.remove(key) }
        }
        this.target = list[Math.floor(Math.random() * list.length)];
        gblMessageManager.push(new Message(this.name, "Your lynch target is: " + this.target))
    }
    eventScan(){
        if(gblPlayerDictionary[this.target].getAlive) return
        for(var key in gblPlayerDictionary){
            if(gblPlayerDictionary[key].getAlign === "Mafia"){ list.remove(key) }
            else if(!gblPlayerDictionary[key].getAlive){ list.remove(key) }
        }
        this.target = list[Math.floor(Math.random() * list.length)];
        gblMessageManager.push(new Message(this.name, "Your lynch target is: " + this.target))
    }
},

"Serial Killer": class SerialKiller extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Serial Killer";
        this.roleReport = "can kill a player.";
    }
    init(){ 
        this.actions.push(new Kill(this.name))
    }
    eventScan(){
        if(this.actions.contains("Murder")) return
        this.actions.push(new Kill(this.name))
    }
},

"Survivor": class Survivor extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Survivor";
        this.roleReport = "can protect themselves.";
    }
    init(){ 
        this.actions.push(new Commute(this.name))
    }
    eventScan(){
        if(this.actions.contains("Survive")) return
        this.actions.push(new Commute(this.name))
    }
    drawActions(){   
        var select = document.getElementById(this.name + "ACID");
        select.style.display = "";
        select.options.add(new Option("Survive"))
        select.selectedIndex = 0;
        var selects = document.getElementsByName(this.name + "TGID");
        selects[0].style.display = ""
        var x = this.actions.returnContains("Survive");
        x.calcTarget()
    }
},

"Terrorist": class Terrorist extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Terrorist";
        this.roleReport = "can kill a player.";
    }
    init(){ 
        this.actions.push(new Kill(this.name))
    }
},

"Turncoat": class Turncoat extends Player {
    constructor(name){
        super(name)
        this.alignment = ["Nobody"];
        this.role = "Turncoat";
        this.roleReport = "can change roles.";
    }
    init(){ 
        gblActionManager.push(new Protect(this.name))
    }
}};