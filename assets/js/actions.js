class Action {
    constructor(owner){
        this.owner = owner;
        this.target = "";
        this.target2 = "";
        this.actionName = "";
        this.selectable = true;
        this.isVisit = true;
        this.visitType = 1;
        this.delayTrigger = 0;
        this.priorityValue = 0;
    }

    get getPriority() { return this.priorityValue }
    get getName() { return this.actionName }
    get getType() { return this.visitType }
    get getSelectable() { return this.selectable }
    get getTarget() { return this.target }
    get getTarget2() { return this.target2 }
    get getOwner() { return this.owner }
    get getVisit() { return this.isVisit }
    get getDelay() { return this.delayTrigger }

    set setPriority(value) { this.priorityValue = value; }
    set setOwner(ownerName) { this.owner = ownerName; }
    set setVisit(bool){ this.isVisit = bool; }
    set setTarget(targetName) { this.target = targetName; }
    set setTarget2(targetName) { this.target2 = targetName; }
    set setName(actionName) { this.actionName = actionName; }
    set setType(visitType) { this.visitType = visitType; }
    set setDelay(delayTrigger) { this.delayTrigger = delayTrigger; }
    set cycleDelay(val) { this.delayTrigger -= val; }

    trigger(){ return }
    runAction(){ return }

    calcTarget(){
        var selects = document.getElementsByName(this.owner + "TGID");
        // quick out shouldn't fire tho
        if(this.visitType == 0){
            selects[0].style.display = "none";
            selects[1].style.display = "none";
            return;
        }
        // proceed
        selects[0].style.display = "";
        selects[1].style.display = "none";
        // build options
        var t1 = gblPlayerList.returnTargetList(this.owner)
        if(this.visitType === 3){ 
            t1 = gblPlayerList.returnTargetList(this.owner, "Alive Mafia") 
        }
        while (selects[0].firstChild) {
            selects[0].removeChild(selects[0].firstChild);
        } // re-populate
        for(var i=0; i<t1.length; i++){ selects[0].add(new Option(t1[i])); }
        selects[0].selectedIndex = 0;
    }
}

class Reroute extends Action {
    constructor(owner){
        super(owner)
        this.visitType = 2;
        this.isVisit = false;
        //driver 10, chaffer 12, hypnotist 14, thief45->65
        switch(gblPlayerDictionary[owner].getRole) {
            case "Driver":
                this.priorityValue = 10;
                this.actionName = "Drive";
                break;
            case "Chauffeur":
                this.priorityValue = 12;
                this.actionName = "Chauffeur";
                break;
            case "Hypnotist":
                this.priorityValue = 25;
                this.actionName = "Hypnotise";
                break;
            case "Thief":
                this.priorityValue = 45;
                this.actionName = "Steal";
                this.isVisit = true;
                break;
        }
    }
    calcTarget(){
        // proceed
        var selects = document.getElementsByName(this.owner + "TGID");
        selects[0].style.display = ""
        selects[1].style.display = ""
        // build options first options
        var t1 = gblPlayerList.returnTargetList(this.actionName === "Steal" ? this.owner : false);
        while (selects[0].firstChild) {
            selects[0].removeChild(selects[0].firstChild);
        } // re-populate
        for(var i=0; i<t1.length; i++){ selects[0].add(new Option(t1[i])); }
        selects[0].selectedIndex = 0;

        // build options first options
        var t2 = gblPlayerList.returnTargetList()
        while (selects[1].firstChild) {
            selects[1].removeChild(selects[1].firstChild);
        } // re-populate
        for(var i=0; i<t2.length; i++){ selects[1].add(new Option(t2[i])); }
        selects[1].selectedIndex = 1 + Math.floor(Math.random() * (t2.length-1));
    }
    runAction(){ 
        if(!this.target){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+this.actionName+" failed because it's target has commuted."))
            return
        }
        var target1 = this.target;
        var target2 = this.target2;
        console.log(target1+" g "+target2)
        switch (this.actionName) {
            case "Drive": case "Chauffeur":
                for(var i=0;i<gblActionManager.length;i++) {
                    var action = gblActionManager[i];
                    if(action.getTarget === target1 && action.getVisit && action.getDelay === 0) { 
                        action.setTarget = target2;
                        gblMessageManager.push(new Message("!GameLog", this.owner + " redirected " 
                                                            + action.getOwner + "'s visit to " + target2 +"."))
                    } 
                    else if(action.getTarget === target2 && action.getVisit && action.getDelay === 0) { 
                        action.setTarget = target1;
                        gblMessageManager.push(new Message("!GameLog", this.owner + " redirected " 
                                                            + action.getOwner + "'s visit to " + target1 +"."))
                    }
                }
                break;
            case "Hypnotise":
                var aList = gblActionManager.filter((act) => act.getOwner === target1 && act.getVisit && action.getDelay === 0);
                if(aList.length > 0){
                    for(var i=0;i<aList.length;i++) {
                        var action = aList[i];
                        action.setTarget = [target2];
                        gblMessageManager.push(new Message("!GameLog", this.owner + " Hypnotises " 
                                                            + target1 + " into visiting " + target2 +"."))
                    }
                } else {
                    gblActionManager.push(new Hypnotised(target1, target2))
                    gblMessageManager.push(new Message("!GameLog", this.owner + " Hypnotises " 
                                                        + target1 + " into visiting " + target2 +"."))
                }
                break;
            case "Steal":
                var blocked = gblPlayerDictionary[this.owner].getBlocked;
                if(blocked.length > 0){
                    gblMessageManager.push(new Message("!GameLog", this.owner + "'s steal was blocked by "+ blocked.toOrderedString() +"."))
                    return
                }
                var targ = gblPlayerDictionary[target1];
                var dest = gblPlayerDictionary[target2];
                targ.addArrival = this.owner;
                if(!targ.getItems.length){
                    gblMessageManager.push(new Message("!GameLog", this.owner + " tried to steal from " 
                                                        + target1 + " but he had nothing to steal."))
                } else {
                    var item = targ.removeItem();
                    dest.addItem = item;
                    gblMessageManager.push(new Message("!GameLog", this.owner + " stole " + item + " from " 
                                                        + target1 + " and gave it to " + target2 + "."))
                }
                break;
        }   
    }
}

class Hypnotised extends Action {
    constructor(owner, target){
        super(owner)
        this.visitType = 1;
        this.selectable = false;
        this.isVisit = true;
        this.priorityValue = 36;
        this.delayTrigger = 0;
        this.actionName = "Hypnotised";
        this.target = target;
    }
}

class Commute extends Action {
    constructor(owner){
        super(owner)
        this.actionName = "Commute";
        this.visitType = 0;
        this.isVisit = false;
        this.priorityValue = 20;
        //commuter, survivor
        switch(gblPlayerDictionary[owner].getRole) {
            case "Commuter":
                break;
            case "Survivor":
                this.actionName = "Survive";
                this.isVisit = true;
                this.visitType = 4;
                break;
        }
    }
    runAction(){
        var aList = gblActionManager.filter((act) => act.getTarget === this.owner);
        if(aList.length > 0){
            for(var i=0;i<aList.length;i++){ 
                aList[i].setTarget = ""; 
                //gblMessageManager.push(new Message("!GameLog", aList[i].getOwner + "'s action failed to target " 
                //                                        + this.owner + " because they have commuted."))
            }
        }
        if(this.actionName === "Commute") return
        if(!this.target){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s action failed because it's target has commuted."))
            return
        }
        var survive = new SoulLink(this.owner, this.target);
        survive.setDelay = 0;
        gblActionManager.push(survive)
        gblPlayerDictionary[this.target].addArrival = this.owner;
        gblMessageManager.push(new Message("!GameLog", this.owner + " has visited " + this.target + 
                                                " to survive, linking their fates."))
    }
}

class Block extends Action {
    constructor(owner){
        super(owner)
        this.actionName = "Block";
        this.priorityValue = 30;
        //politic 30, drunk 32, hooker 32, jailor 32, lawyer 34, sabator 34, virgin 34
        switch(gblPlayerDictionary[owner].getRole) {
            case "Politician":
                this.actionName = "Block All";
                this.priorityValue = 30;
                this.visitType = 0;
                this.isVisit = false;
                break;
            case "Town Drunk":
                this.priorityValue = 32;
                break;
            case "Hooker":
                this.priorityValue = 32;
                break;
            case "Jailor":
                this.actionName = "Jail";
                this.priorityValue = 32;
                break;
            case "Lawyer":
                this.actionName = "Lawyer";
                this.priorityValue = 34;
                break;
            case "Saboteur":
                this.actionName = "Sabotage";
                this.priorityValue = 34;
                break;
            case "Virgin":
                this.actionName = "Martyr";
                this.priorityValue = 62;
                this.delayTrigger = 1;
                this.selectable = false;
                this.isVisit = false;
                this.visitType = 0;
                break;
        }
    }
    runAction(){
        if(!this.target && this.visitType) {
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                            +" action failed because it's target has commuted."))
            return
        }
        switch(this.actionName) {
            case "Block All":
                var plist = gblPlayerList.returnTargetList(this.owner);
                for(var i=0;i<plist.length;i++) {
                    gblPlayerDictionary[plist[i]].addBlock = this.owner;
                }
                gblMessageManager.push(new Message("!GameLog", this.owner + " has blocked all further actions for the night."))
                break;
            case "Block":
                var blocked = gblPlayerDictionary[this.owner].getBlocked;
                if(blocked.length > 0){
                    for(var i=0;i<blocked.length;i++) {
                        if(gblPlayerDictionary[blocked[i]].getRole === "Politician"){
                            gblMessageManager.push(new Message("!GameLog", this.owner + "'s block was blocked by "+ blocked[i] +"."))
                            return
                        }
                    }
                }
                gblPlayerDictionary[this.target].addBlock = this.owner;
                gblPlayerDictionary[this.target].addArrival = this.owner;
                gblMessageManager.push(new Message("!GameLog", this.owner + " has blocked "+ this.target +"."))
                break;
            case "Jail":
                var blocked = gblPlayerDictionary[this.owner].getBlocked;
                if(blocked.length > 0){
                    for(var i=0;i<blocked.length;i++) {
                        if(gblPlayerDictionary[blocked[i]].getRole === "Politician"){
                            gblMessageManager.push(new Message("!GameLog", this.owner + "'s jailing was blocked by "+ blocked[i] +"."))
                            return
                        }
                    }
                }
                gblPlayerDictionary[this.target].addBlock = this.owner;
                gblPlayerDictionary[this.target].addArrival = this.owner;
                var prot = new Protect(this.owner);
                prot.setTarget = this.target;
                gblActionManager.push(prot);
                gblMessageManager.push(new Message("!GameLog", this.owner + " has jailed "+ this.target +"."))
                break;
            case "Lawyer":
                var blocked = gblPlayerDictionary[this.owner].getBlocked;
                if(blocked.length > 0){
                    gblMessageManager.push(new Message("!GameLog", this.owner + "'s lawyer was blocked by "+ blocked.toOrderedString() +"."))
                    return
                }
                gblPlayerDictionary[this.target].addArrival = this.owner;
                var lt = gblActionManager.filter((inv) => inv.constructor.name === "Investigate" && inv.getTarget === this.target);
                if(lt.length > 0){
                    for(var i=0;i<lt.length;i++) {
                        gblPlayerDictionary[lt[i]].addBlock = this.owner;
                        gblMessageManager.push(new Message("!GameLog", this.owner + " has blocked "+ this.target +
                                                            "'s actions with legalese."))
                    }
                }
                break;
            case "Sabotage":
                var blocked = gblPlayerDictionary[this.owner].getBlocked;
                if(blocked.length > 0){
                    gblMessageManager.push(new Message("!GameLog", this.owner + "'s sabotage was blocked by "+ blocked.toOrderedString() +"."))
                    return
                }
                gblPlayerDictionary[this.target].addArrival = this.owner;
                gblActionManager.push(new Sabotage(this.owner, this.target))
                gblMessageManager.push(new Message("!GameLog", this.owner + " has sabotaged "+ this.target +"'s items."))
                break;
            case "Martyr":
                break;
        }
    }
}

class Sabotage extends Action {
    constructor(owner, target){
        super(owner)
        this.visitType = 0;
        this.selectable = false;
        this.isVisit = false;
        this.priorityValue = 32;
        this.delayTrigger = 2;
        this.actionName = "Sabotage";
        this.target = target;
    }
}

class Protect extends Action {
    constructor(owner){
        super(owner)
        this.actionName = "Protect";
        this.priorityValue = 40;
        //Armour, Doctor***, Jack-of-all-trades, Jailor (Dual Action), Nurse, Sidekick, Turncoat, Veteran
        switch(gblPlayerDictionary[owner].getRole) {
            case "Doctor": case "Jack-of-all-trades": case "Nurse":
                break;
            case "Jailor":
                this.selectable = false;
                this.isVisit = false;
                break; 
            case "Bodyguard":
                this.actionName = "Guard";
                break;
            case "Bouncer":
                this.actionName = "Guard";
                this.visitType = 3;
                break;
            case "Sidekick": case "Veteran":
                this.actionName = "Role Protect";
                this.selectable = false;
                this.isVisit = false;
                this.visitType = 0;
                this.delayTrigger = -1;
                break;
            case "Turncoat":
                this.actionName = "Role Protect";
                this.selectable = false;
                this.isVisit = false;
                this.visitType = 0;
                this.delayTrigger = -1;
                break;
        }
    }
    runAction(){
        switch(this.actionName) {
            case "Protect":
                if(!this.target){
                    gblMessageManager.push(new Message("!GameLog", this.owner + "'s protection failed because it's target has commuted."))
                    return
                }
                var blocked = gblPlayerDictionary[this.owner].getBlocked;
                if(blocked.length > 0){
                    gblMessageManager.push(new Message("!GameLog", this.owner + "'s protection was blocked by "+ blocked.toOrderedString() +"."))
                    return
                }
                gblPlayerDictionary[this.target].addProtect = this.owner;
                gblMessageManager.push(new Message("!GameLog", this.owner + " has protected "+ this.target +"."))
                break;
            case "Guard":
                if(!this.target){
                    gblMessageManager.push(new Message("!GameLog", this.owner + "'s guard failed because it's target has commuted."))
                    return
                }
                var blocked = gblPlayerDictionary[this.owner].getBlocked;
                if(blocked.length > 0){
                    gblMessageManager.push(new Message("!GameLog", this.owner + "'s guard was blocked by "+ blocked.toOrderedString() +"."))
                    return
                }
                gblPlayerDictionary[this.target].addProtect = this.owner;
                gblActionManager.push(new Guard(this.owner, this.target))
                gblMessageManager.push(new Message("!GameLog", this.owner + " guarded "+ this.target +"."))
                break;
            case "Protect Self":
                var blocked = gblPlayerDictionary[this.owner].getBlocked;
                if(blocked.length > 0){
                    gblMessageManager.push(new Message("!GameLog", this.owner + "'s self protection was blocked by "+ blocked.toOrderedString() +"."))
                    return
                }
                gblPlayerDictionary[this.owner].addProtect = this.owner;
                gblMessageManager.push(new Message("!GameLog", this.owner + " is protecting themself."))
                break;
            default:
                break;
        }
    }
    trigger(killer){
        switch (gblPlayerDictionary[this.owner].getRole) {
            case "Sidekick": case "Veteran":
                if(this.delayTrigger !== 0){
                    this.delayTrigger = 0;
                    gblPlayerDictionary[this.owner].addProtect = this.actionName;
                }
                break;
            case "Turncoat":
                if(this.delayTrigger !== 0){
                    this.delayTrigger = 0;
                    gblPlayerDictionary[this.owner].addProtect = this.actionName;
                    var act = new MiscEvent(this.owner);
                    act.setInfo = killer;
                    gblActionManager.push(act)
                }
                break;
            default:
                break;
        }
    }
}

class GiveItem extends Action {
    constructor(owner){
        super(owner)
        this.priorityValue = 50;
        //Arsonist, Baker, Blacksmith, Bootlegger, Gunsmith, Postman-rand, Reporter, Blackmailed(spawn)
        // var x = Math.floor((Math.random() * 3)); console.log(nsItems[x])
        switch(gblPlayerDictionary[owner].getRole) {
            case "Arsonist":
                this.actionName = "Douse";
                break;
            case "Baker":
                this.actionName = "Give Bread";
                break;
            case "Blacksmith":
                this.actionName = "Give Armour";
                break;
            case "Bootlegger":
                this.actionName = "Give Moonshine";
                break;
            case "Gunsmith":
                this.actionName = "Give Gun";
                break;
            case "Neighbour":
                this.actionName = "Give Identity";
                break;
            case "Postman":
                this.actionName = "Give Item";
                break;
            case "Poisoner":
                this.actionName = "Poison";
                this.priorityValue = 60;
                break;
            case "Reporter":
                this.actionName = "Give Report";
                break;
            case "Silencer":
                this.actionName = "Silence";
                break;
        }
    }
    calcTarget(){
        // proceed
        var selects = document.getElementsByName(this.owner + "TGID");
        selects[0].style.display = ""
        selects[1].style.display = "none"
        var tl = [];
        if(this.actionName === "Give Armour"){
            var acts = gblPlayerDictionary[this.owner].getActions
            acts = acts.filter((act) => act.getName === "Give Armour")
            for(var i=0; i<acts.length; i++) tl.push(acts[i].getTarget)
        } else {
            var tl = gblPlayerList.clone().remove(this.owner);
        }
        for(var key in gblPlayerDictionary){ 
            if(!gblPlayerDictionary[key].getAlive) tl.remove(key) }
        while (selects[0].firstChild) {
            selects[0].removeChild(selects[0].firstChild);
        } // re-populate
        for(var i=0; i<tl.length; i++){ selects[0].add(new Option(tl[i])); }
        selects[0].selectedIndex = 0;
    }
    runAction(){
        if(!this.target){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action failed because it's target has commuted."))
            return
        }
        var blocked = gblPlayerDictionary[this.owner].getBlocked;
        if(blocked.length > 0){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action was blocked by "+ blocked.toOrderedString() +"."))
            return
        }
        var targ = this.target;
        switch (this.actionName) {
            case "Douse":
                var act = new Death(this.owner, targ)
                act.setName = "Doused";
                act.setDelay = -1;
                gblActionManager.push(act)
                gblMessageManager.push(new Message(targ, "You have been doused in gas."))
                gblMessageManager.push(new Message("!GameLog", this.owner + " has doused "+ targ +" in gas."))
                break;
            case "Give Bread":
                gblPlayerDictionary[targ].addItem = "Bread";
                gblMessageManager.push(new Message("!GameLog", this.owner + " gave bread to "+ targ +"."))
                break;
            case "Give Armour":
                gblPlayerDictionary[targ].addItem = "Armour";
                gblMessageManager.push(new Message("!GameLog", this.owner + " gave armour to "+ targ +"."))
                break;
            case "Give Moonshine":
                gblPlayerDictionary[targ].addItem = "Moonshine";
                gblMessageManager.push(new Message("!GameLog", this.owner + " gave moonshine to "+ targ +"."))
                break;
            case "Give Gun":
                gblPlayerDictionary[targ].addItem = "Gun";
                gblMessageManager.push(new Message("!GameLog", this.owner + " gave a gun to "+ targ +"."))
                break;
            case "Give Identity":
                gblMessageManager.push(new Message(targ, "You were visited by "+ this.owner +" the friendly Neighbour."))
                gblMessageManager.push(new Message("!GameLog", this.owner + " let "+ targ +" know that they are the neighbour."))
                break;
            case "Give Item":
                var rand = nsItems[Math.floor(Math.random() * 3)];
                gblPlayerDictionary[targ].addItem = rand;
                var pref = rand === "Armour" ? "" : "a ";
                gblMessageManager.push(new Message("!GameLog", this.owner + " gave "+ pref + rand.toLowerCase() +" to "+ targ +"."))
                break;
            case "Poison":
                var act = new Death(this.owner, targ)
                act.setName = "Poison";
                act.setDelay = 2;
                gblActionManager.push(act)
                gblMessageManager.push(new Message(targ, ":skull: You have been poisoned :skull:"))
                gblMessageManager.push(new Message("!GameLog", this.owner + " has poisoned "+ targ +"."))
                break;
            case "Give Report":
                gblPlayerDictionary[targ].addItem = "Report";
                gblMessageManager.push(new Message("!GameLog", this.owner + " gave a report to "+ targ +"."))
                break;
            case "Silence":
                gblMessageManager.push(new Message(targ, "During the next day phase, you can not speak **AT ALL!** :speak_no_evil:.\n"+
                                    "Any other action maybe be performed normally, or by direct message to the GM when applicable."))
                gblMessageManager.push(new Message("!GameLog", this.owner + " has silenced " + targ + "."))
                break;
        }
    }
}

class PassItem extends GiveItem {
    constructor(owner, item){
        super(owner)
        this.isVisit = false;
        switch(item){
            case "Moonshine":
                this.actionName = "Pass Moonshine";
                this.priorityValue = 50;
                break;
            case "Evidence":
                this.actionName = "Pass Evidence";
                this.priorityValue = 50;
                break;
            case "EvidenceSpawn":
                this.actionName = "Evidence Spawn";
                this.priorityValue = 70;
                this.delayTrigger = 1;
                break;
            case "Report":
                this.actionName = "Report"
                this.priorityValue = 70;
                break;
        }
    }
    runAction(){
        if(!this.target && this.actionName !== "Evidence Spawn"){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action failed because it's target has commuted."))
            return
        }
        var blocked = gblPlayerDictionary[this.owner].getBlocked;
        if(blocked.length > 0){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action was blocked by "+ blocked.toOrderedString() +"."))
            return
        }
        var targ = this.target;
        switch(this.actionName){
            case "Pass Moonshine":
                if(gblPlayerDictionary[this.owner].removeItem("Moonshine")){
                    gblPlayerDictionary[targ].addItem = "Moonshine";
                    gblMessageManager.push(new Message("!GameLog", this.owner + " passed moonshine to "+ targ +"."))
                } else {
                    gblMessageManager.push(new Message("!GameLog", this.owner + " has misplaced the moonshine they planned to pass."));
                }
                break;
            case "Pass Evidence":
                if(gblPlayerDictionary[this.owner].removeItem("Evidence")){
                    gblPlayerDictionary[targ].addItem = "Evidence";
                    gblMessageManager.push(new Message("!GameLog", this.owner + " passed the evidence to "+ targ +"."))
                } else {
                    gblMessageManager.push(new Message("!GameLog", this.owner + " has misplaced the evidence they planned to pass."));
                }
                break;
            case "Evidence Spawn":
                var plist = gblPlayerList.returnTargetList(this.owner);
                var targ = plist[Math.floor(Math.random() * plist.length)];
                gblPlayerDictionary[targ].addItem = "Evidence";
                gblMessageManager.push(new Message("!GameLog", targ + " has recieved the evidence."));
                break;
            case "Report":
                var algn = gblPlayerDictionary[targ].investigateAlignment;
                var pref = "The ";
                algn === "Nobody" ? pref = "" : pref = "The ";
                gblMessageManager.push(new Message(this.owner, "Your report reveals that "+ targ +" is aligned with "+ pref + algn +"."))
                gblMessageManager.push(new Message("!GameLog", this.owner + "'s report revealed that "+ targ 
                                                                +" is aligned with "+ pref + algn +"."))
                break;
        }
    }
}

class Kill extends Action {
    constructor(owner, type){
        super(owner)
        this.priorityValue = 60;
        this.actionName = "Kill";
        this.bypass = false;
        var role = "";
        if(type === "Mafia Kill" || type === "Gun") role = type;
        else role = gblPlayerDictionary[owner].getRole;
        switch(role) {
            case "Arsonist":
                this.actionName = "Ignite";
                this.visitType = 0;
                this.isVisit = false;
                break;
            case "Blackmailed":
                this.actionName = "Hunt Item";
                break;
            case "Jack-of-all-trades":
                break;
            case "Serial Killer":
                this.actionName = "Murder";
                break;
            case "Vigilante":
                break;
            case "Terrorist":
                this.actionName = "Suicide Bomb";
                this.bypass = true;
                break;
            case "Mafia Kill":
                this.actionName = "Mafia Kill";
                break;
        }
    }
    get getBypass(){ return this.bypass }
    set setBypass(bool){ this.bypass = bool; }
    runAction(){
        if(this.actionName !== "Ignite" && !this.target){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action failed because it's target has commuted."))
            return
        }
        var blocked = gblPlayerDictionary[this.owner].getBlocked;
        if(blocked.length > 0){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action was blocked by "+ blocked.toOrderedString() +"."))
            return
        }
        var targ = this.target;
        switch(this.actionName) {
            case "Ignite":
                var aList = gblActionManager.filter((act) => act.getOwner === this.owner  && act.getName === "Doused");
                var i = aList.length;
                while (i--) { aList[i].runAction() }
                break;
            case "Hunt Item":
                if(gblPlayerDictionary[targ].getItems.includes("Evidence")){
                    var result = gblPlayerDictionary[targ].kill(this.bypass, this.owner);
                    if(result[0]) {
                        gblPlayerDictionary[targ].removeItem("Evidence")
                        gblPlayerDictionary[this.owner].addItem = "Evidence";
                    }
                    gblMessageManager.push(new Message("!GameLog", this.owner + " found the evidence on "+ targ +" and trys to kill them"+ result[1]))
                } else gblMessageManager.push(new Message("!GameLog", this.owner + " searches "+ targ +" for the evidence, but they do not have it."))
                break;
            case "Kill": case "Murder":
                var result = gblPlayerDictionary[targ].kill(this.bypass, this.owner);
                gblMessageManager.push(new Message("!GameLog", this.owner + " attempts to kill "+ targ + result[1]))
                break;
            case "Suicide Bomb":
                var result = gblPlayerDictionary[targ].kill(this.bypass, this.owner);
                gblActionManager.push(new Death("", this.owner))
                gblMessageManager.push(new Message("!GameLog", this.owner + " suicide bombs "+ targ + result[1]))
                break;
            case "Mafia Kill":
                var sList = gblActionManager.filter((act) => act.constructor.name === "MiscEvent");
                var killmsg = " performs the mafia kill on ";
                if(sList.contains("Power Kill")) {
                    this.bypass = true;
                    killmsg = " performs a strongman power kill on ";
                }
                var result = gblPlayerDictionary[targ].kill(this.bypass, this.owner);
                gblMessageManager.push(new Message("!GameLog", this.owner + killmsg + targ + result[1]))
                if(sList.contains("Clean up") && result[0]) {
                    var action = gblActionManager.returnContains("Clean up");
                    action.setTarget = targ;
                }
                break;
        }
    }
}

class Guard extends Action {
    constructor(owner, target){
        super(owner)
        this.target = target;
        this.actionName = "Guard";
        this.priorityValue = 62;
        //bodyguard, bouncer-visit
        switch(gblPlayerDictionary[owner].getRole) {
            case "Bodyguard":
                break;
            case "Bouncer":
                this.visitType = 3;
                break;
        }
    }
    trigger(name){
        gblActionManager.push(new Death(this.owner, this.owner))
        gblActionManager.push(new Death(this.owner, name))
        gblMessageManager.push(new Message("!GameLog", name + "'s kill attempt triggers "+ this.owner +"'s guard killing them both."))
    }
}

class AlignMask extends Action {
    constructor(owner){
        super(owner)
        this.priorityValue = 65;
        //Framer, Tailor-visit
        switch(gblPlayerDictionary[owner].getRole) {
            case "Framer":
                this.actionName = "Frame";
                break;
            case "Tailor":
                this.actionName = "Tailor";
                this.visitType = 3;
                break;
            case "Cult Leader":
                this.actionName = "Convert";
                break;
        }
    }
    runAction(){
        if(!this.target){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action failed because it's target has commuted."))
            return
        }
        var blocked = gblPlayerDictionary[this.owner].getBlocked;
        if(blocked.length > 0){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action was blocked by "+ blocked.toOrderedString() +"."))
            return
        }
        var targ = this.target;
        switch(this.actionName) {
            case "Frame":
                gblPlayerDictionary[targ].addAlign = "Mafia";
                gblMessageManager.push(new Message("!GameLog", this.owner + " has framed "+ targ +". They will appear as mafia to investigation."))
                break;
            case "Tailor":
                gblPlayerDictionary[targ].addAlign = "Village";
                gblMessageManager.push(new Message("!GameLog", this.owner + " has tailored "+ targ +". They will appear as a villager to investigation."))
                break;
            case "Convert":
                gblPlayerDictionary[targ] = new nsRoles["Cultist"](targ);
                gblPlayerDictionary[targ].init();
                gblActionManager.push(new SoulLink(this.owner, targ))
                gblMessageManager.push(new Message(targ, "You have been converted to the cult by "+ this.owner +", your role is now Cultist."))
                var cultList = gblPlayerList.returnTargetList(targ, "Alive Cult");
                gblMessageManager.push(new Message("!GMAction", "-> add "+ targ +" to cult chat with "+ cultList.toOrderedString() +"."))
                gblMessageManager.push(new Message("!GameLog", this.owner + " has converted "+ targ +" to the cult."))
                break;
        }
    }
}

class Investigate extends Action {
    constructor(owner){
        super(owner)
        this.actionName = "Investigate";
        this.priorityValue = 70;
        //cop, Coroner, Deputy, Detective, JOAT, Spy, Tracker-nin, Watcher-nin
        switch(gblPlayerDictionary[owner].getRole) {
            case "Cop": case "Deputy":
                break;
            case "Jack-of-all-trades":
                this.actionName = "Learn Alignment";
                break;
            case "Detective": case "Spy":
                this.actionName = "Detect Role";
                break;
            case "Coroner":
                this.actionName = "Inspect Death";
                break;
            case "Priest":
                this.actionName = "Visit";
                break;
            case "Tracker":
                this.actionName = "Track";
                break;
            case "Watcher":
                this.actionName = "Watch";
                break;            
        }
    }
    runAction(){
        if(!this.target){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action failed because it's target has commuted."))
            return
        }
        var blocked = gblPlayerDictionary[this.owner].getBlocked;
        if(blocked.length > 0){
            gblMessageManager.push(new Message("!GameLog", this.owner + "'s "+ this.actionName.toLowerCase() 
                                                        +" action was blocked by "+ blocked.toOrderedString() +"."))
            return
        }
        var targ = this.target;
        switch(this.actionName) {
            case "Investigate":
                var msg = "Your target is not aligned with the Mafia.";
                var logmsg = ", which returns as not mafia aligned.";
                if(gblPlayerDictionary[targ].investigateAlignment === "Mafia") {
                    msg = "Your target is aligned with the Mafia.";
                    logmsg = ", which returns as mafia aligned";
                }
                gblMessageManager.push(new Message(this.owner, msg))
                gblMessageManager.push(new Message("!GameLog", this.owner + " investigated "+ targ + logmsg))
                break;
            case "Learn Alignment":
                var pref = "The ";
                var algn = gblPlayerDictionary[targ].investigateAlignment;
                if(algn === "Nobody") pref = "";
                gblMessageManager.push(new Message(this.owner, "Your target is aligned with "+ pref + algn +"."))
                gblMessageManager.push(new Message("!GameLog", this.owner + " learnt "+ targ +"'s alignment."))
                break;
            case "Detect Role":
                gblMessageManager.push(new Message(this.owner, "Your target's role " + gblPlayerDictionary[targ].getRoleReport))
                gblMessageManager.push(new Message("!GameLog", this.owner + " detected "+ targ +"'s role."))
                break;
            case "Inspect Death":
                if(targ.getAlive) {
                    gblMessageManager.push(new Message("!GameLog", this.owner + "'s body inspection failed because they were redirected to a living player."))
                    return
                }
                var player = gblPlayerDictionary[targ];
                if(player.getRoleReveal) {
                    var arrivals = player.getArrivals[player.getDeathCycle];
                    if(!arrivals){
                        gblMessageManager.push(new Message(this.owner, "Your target was not visited by anyone on the night they died."))
                        gblMessageManager.push(new Message("!GameLog", this.owner + " inpected "+ targ +"'s body, discovering nothing."))
                    } else if(arrivals.length > 1) {
                        gblMessageManager.push(new Message(this.owner, "Your target's last visitors were "+ arrivals.toOrderedString() +"."))
                        gblMessageManager.push(new Message("!GameLog", this.owner + " inpected "+ targ +"'s body, discovering their last visitors."))
                    } else {
                        gblMessageManager.push(new Message(this.owner, "Your target's last visitor was "+ arrivals.toOrderedString() +"."))
                        gblMessageManager.push(new Message("!GameLog", this.owner + " inpected "+ targ +"'s body, discovering their last visitor."))
                    }
                } else {
                    gblMessageManager.push(new Message(this.owner, "Your target's role was "+ gblPlayerDictionary[targ].getRole +"."))
                    gblMessageManager.push(new Message("!GameLog", this.owner + " inpected "+ targ +"'s body, discovering their last visitor."))
                }
                break;
            case "Visit":
                gblMessageManager.push(new Message("!GameLog", this.owner + " the priest visits "+ targ +"."))
                break;
            case "Track":
                var player = gblPlayerDictionary[targ];
                var ninja = "";
                for(var key in gblPlayerDictionary) {
                    if(gblPlayerDictionary[key].getRole === "Ninja") ninja = key;
                }
                var visited = player.getDeparture[gblGameCycles];
                if(visited) visited.remove(ninja)
                if(visited) {
                    gblMessageManager.push(new Message(this.owner, "Your target visited "+ visited.toOrderedString() +" last night."))
                    gblMessageManager.push(new Message("!GameLog", this.owner + " tracked "+ targ +" visiting "+ visited.toOrderedString() +"."))
                } else {
                    gblMessageManager.push(new Message(this.owner, "Your target did not visit anyone last night."))
                    gblMessageManager.push(new Message("!GameLog", this.owner + " tracked "+ targ +", but discovered nothing."))
                }
                break;
            case "Watch":
                var player = gblPlayerDictionary[targ];
                var ninja = "";
                for(var key in gblPlayerDictionary) {
                    if(gblPlayerDictionary[key].getRole === "Ninja") ninja = key;
                }
                var arrived = player.getArrivals[gblGameCycles];
                if(arrived) {
                    arrived.remove(this.owner)
                    arrived.remove(ninja)
                }
                if(arrived) {
                    gblMessageManager.push(new Message(this.owner, "Your target was visited by "+ arrived.toOrderedString() +" last night."))
                    gblMessageManager.push(new Message("!GameLog", this.owner + " watched "+ targ +" being visited by "+ arrived.toOrderedString() +"."))
                } else {
                    gblMessageManager.push(new Message(this.owner, "Your target was visited by nobody last night."))
                    gblMessageManager.push(new Message("!GameLog", this.owner + " watched "+ targ +", but discovered nothing."))
                }
                break;            
        }
    }
    calcTarget(){
        // quick out shouldn't fire tho
        if(this.visitType == 0) return;
        // proceed
        var selects = document.getElementsByName(this.owner + "TGID");
        selects[0].style.display = ""
        selects[1].style.display = "none"
        // build options
        var t1 = gblPlayerList.clone().remove(this.owner);
        for(var key in gblPlayerDictionary){ 
            if(this.actionName === "Inspect Death"){
                if(gblPlayerDictionary[key].getAlive) t1.remove(key) 
            } else {
                if(!gblPlayerDictionary[key].getAlive) t1.remove(key) 
            }
        }
        while (selects[0].firstChild) {
            selects[0].removeChild(selects[0].firstChild);
        } // re-populate
        for(var i=0; i<t1.length; i++){ selects[0].add(new Option(t1[i])); }
        selects[0].selectedIndex = 0;
    }
}

class MiscEvent extends Action {
    constructor(owner){
        super(owner)
        this.visitType = 0;
        this.selectable = false;
        this.isVisit = false;
        this.priorityValue = 80;
        this.miscInfo = "";
        //amnesiac, famine, Virgin, bookie, poisoner
        switch(gblPlayerDictionary[owner].getRole){
            case "Baker":
                this.actionName = "Famine";
                this.priorityValue = 80;
                this.delayTrigger = 4;
                break;
            case "Cop":
                this.actionName = "Pass Cop";
                this.priorityValue = 95;
                this.delayTrigger = 1;
                break;
            case "Doctor":
                this.actionName = "Pass Doctor";
                this.priorityValue = 95;
                this.delayTrigger = 1;
                break;
            case "Vigilante":
                this.actionName = "Pass Vigilante";
                this.priorityValue = 95;
                this.delayTrigger = 1;
                break;
            case "Bookie":
                this.actionName = "Book";
                this.visitType = 1;
                this.selectable = true;
                this.delayTrigger = 1;
                this.priorityValue = 100;
                break;
            case "Janitor":
                this.actionName = "Clean up";
                this.selectable = true;
                this.priorityValue = 62;
                break;
            case "Strongman":
                this.actionName = "Power Kill";
                this.selectable = true;
                break;
            case "Amnesiac":
                this.actionName = "Choose Role";
                this.selectable = true;
                this.visitType = 1;
                this.priorityValue = 100;
                break;
            case "Turncoat":
                this.actionName = "Change Role";
                this.priorityValue = 100;
                break;
        }
    }
    set setInfo(msg) { this.miscInfo = msg; }
    calcTarget(){
        // quick out shouldn't fire tho
        if(this.visitType === 0) return;
        if(this.actionName !== "Choose Role"){ 
            super.calcTarget()
            return
        }
        // proceed
        var selects = document.getElementsByName(this.owner + "TGID");
        selects[0].style.display = ""
        selects[1].style.display = "none"
        // build options
        var t1 = gblPlayerList.returnTargetList(this.owner);
        while (selects[0].firstChild) {
            selects[0].removeChild(selects[0].firstChild);
        } // re-populate
        for(var i=0; i<t1.length; i++){ selects[0].add(new Option(t1[i])); }
        selects[0].selectedIndex = 0;
    }
    runAction(){
        switch (this.actionName) {
            case "Famine":
                var pList = gblPlayerList.returnTargetList();
                for(var key in gblPlayerDictionary) {
                    if(gblPlayerDictionary[key].getItems.includes("Bread")) pList.remove(key)
                }
                for(var i=0;i<pList.length;i++) {
                    gblActionManager.push(new Death("", pList[i]))
                    gblMessageManager.push(new Message("!GameLog", pList[i] + " has starved to death."))
                }
                break;
            case "Pass Cop":
                var dep = "";
                for(var key in gblPlayerDictionary) {
                    if(gblPlayerDictionary[key].getRole === "Deputy") dep = key;
                }
                if(dep) { 
                    gblPlayerDictionary[dep] = new nsRoles["Cop"](dep)
                    gblPlayerDictionary[dep].init()
                    gblMessageManager.push(new Message("!GameLog", dep + " has adopted the role of the Cop."))
                    gblMessageManager.push(new Message(dep, "Your role has changed to Cop."))
                }
                break;
            case "Pass Doctor":
                var nur = "";
                for(var key in gblPlayerDictionary) {
                    if(gblPlayerDictionary[key].getRole === "Nurse") nur = key;
                }
                if(nur) { 
                    gblPlayerDictionary[nur] = new nsRoles["Doctor"](nur)
                    gblPlayerDictionary[nur].init()
                    gblMessageManager.push(new Message("!GameLog", nur + " has adopted the role of the Doctor."))
                    gblMessageManager.push(new Message(nur, "Your role has changed to Doctor."))
                }
                break;
            case "Pass Vigilante":
                var side = "";
                for(var key in gblPlayerDictionary) {
                    if(gblPlayerDictionary[key].getRole === "Sidekick") side = key;
                }
                if(side) { 
                    gblPlayerDictionary[side] = new nsRoles["Vigilante"](side)
                    gblPlayerDictionary[side].init()
                    gblMessageManager.push(new Message("!GameLog", side + " has adopted the role of the Vigilante."))
                    gblMessageManager.push(new Message(side, "Your role has changed to Vigilante."))
                }
                break;
            case "Book": case "Power Kill":
                break;
            case "Clean up":
                gblPlayerDictionary[this.target].setRoleReveal = false;
                gblMessageManager.setReveal = this.target;
                gblMessageManager.push(new Message(this.owner, "Your target's role was "+ gblPlayerDictionary[targ].getRole +"."))
                gblMessageManager.push(new Message("!GameLog", this.owner + " has hidden "+ this.target +"'s role from the village."))
                break;
            case "Choose Role":
                var role = gblPlayerDictionary[this.target].getRole;
                gblPlayerDictionary[this.owner] = new nsRoles[role](this.owner);
                gblPlayerDictionary[this.owner].init()
                gblMessageManager.push(new Message("!GameLog", this.owner + " has adopted "+ this.target +"'s role of "+ role +"."))
                gblMessageManager.push(new Message(side, "Your role has changed to "+ role +"."))
                break;
            case "Change Role":
                var newRole = ""
                var align = gblPlayerDictionary[this.miscInfo].getAlign;
                switch (align) {
                    case "Village":
                        var mPlayers = gblPlayerList.returnTargetList(this.owner, "Mafia");
                        var newRoleList = nsMafia.clone();
                        for(var i=0;i<mPlayers.length;i++) {
                            newRoleList.remove(gblPlayerDictionary[mPlayers[i]].getRole)
                        }
                        newRole = newRoleList[Math.floor(Math.random() * newRoleList.length)];
                        align = "the mafia";
                        break;
                    case "Mafia":
                        var vPlayers = gblPlayerList.returnTargetList(this.owner, "Village");
                        var newRoleList = nsVillagers.clone();
                        for(var i=0;i<vPlayers.length;i++) {
                            newRoleList.remove(gblPlayerDictionary[vPlayers[i]].getRole)
                        }
                        newRole = newRoleList[Math.floor(Math.random() * newRoleList.length)];
                        align = "the village";
                        break;
                    default:
                        newRole = "Amnesiac";
                        align = "nobody";
                        break;
                }
                gblPlayerDictionary[this.owner] = new nsRoles[newRole](this.owner);
                gblPlayerDictionary[this.owner].init()
                gblMessageManager.push(new Message("!GameLog", this.miscInfo + "'s kill attempt failed causing " + this.owner + 
                                                    " to join " + align + " as a " + newRole + "."))
                gblMessageManager.push(new Message(this.owner, "You are now aligned to " + align + ". Your new role is " 
                                                        + newRole + "."))
                break;
            default:
                break;
        }
    }
}

class SoulLink extends Action {
    constructor(owner, target){
        super(owner)
        this.visitType = 0;
        this.selectable = false;
        this.isVisit = false;
        this.priorityValue = 100;
        this.delayTrigger = -1;
        this.actionName = "Soul Link";
        this.target = target;
    }
    trigger(){
        if(gblPlayerDictionary[this.owner].getAlive) gblPlayerDictionary[this.owner].setAlive = false;
        if(gblPlayerDictionary[this.target].getAlive) gblPlayerDictionary[this.target].setAlive = false;
        gblMessageManager.push(new Message("!GameLog", this.owner +" dies because their and "+ this.target +"'s fates were linked."))
    }
}

class Death extends Action {
    constructor(owner, target) {
        super(owner)
        this.target = target ? target : "";
        this.actionName = "Death";
        this.visitType = 0;
        this.selectable = false;
        this.isVisit = false;
        this.priorityValue = 90;
    }
    runAction() {
        if(this.target){
            gblPlayerDictionary[this.target].setAlive = false;
            if(this.actionName === "Poison") gblMessageManager.push(new Message("!GameLog", this.target +" has died from poison."))
            if(this.actionName === "Shoot Trespasser") gblMessageManager.push(new Message("!GameLog", this.owner +" killed "
                                                                                + this.target +" for trespassing on their land."))
        }
    }
}

class RemoveItem extends Action {
    constructor(target, item){
        super("")
        this.target = target;
        this.actionName = item;
        this.selectable = false;
        this.isVisit = false;
        this.visitType = 0;
        this.delayTrigger = 0;
        this.priorityValue = 90;
    }
    runAction(){
        gblPlayerDictionary[this.target].removeItem(item)
    }
}
class VisitAlloc extends Action {
    constructor(){
        super("")
        this.target = "";
        this.actionName = "Visit Allocator";
        this.selectable = false;
        this.isVisit = false;
        this.visitType = 0;
        this.delayTrigger = 0;
        this.priorityValue = 35;
    }
    runAction(){
        var list = gblActionManager.filter((act) => act.getVisit);
        list = list.filter((act) => !gblPlayerDictionary[act.getOwner].getBlocked.length > 0)
        for(var i=0;i<list.length;i++){
            if(list[i].getTarget !== "") {
                gblPlayerDictionary[list[i].getTarget].addArrival = list[i].getOwner;
                gblPlayerDictionary[list[i].getOwner].addDeparture = list[i].getTarget;
            }
        }
    }
}