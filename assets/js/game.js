function runGame(){
    document.getElementById("gameDiv").style.display = "";
    document.getElementById("gameHeaderDivID").innerText = phaseText(gblGameCycles);
    document.getElementById("calculateButtonID").innerText = "Proceed to " + phaseText(gblGameCycles+1);

    gblMafiaKill = new MafiaKill("!Mafia");
    gblMafiaKill.init();
    gblMafiaKill2 = new MafiaKill("!MafiaDouble");
    gblMafiaKill2.init();
    addPhaseLog()

    var mafs = [];
    for(var key in gblPlayerDictionary){
        if(gblPlayerDictionary[key].getAlign === "Mafia"){
            mafs.push(key)
        }
    }
    mafs.reverse()
    if(mafs.length > 1){
        var paste = "";
        var targs = mafs.toOrderedString();
        gblMessageManager.push(new Message("!GameLog", targs + " are The Mafia."))
        var i = mafs.length;
        while (i--) {
            paste += "***" + mafs[i] + "*** *the* ***" + gblPlayerDictionary[mafs[i]].getRole + "***\n"
        }
        gblMessageManager.push(new Message("!GMAction", "-> Open a chat group containing: " + targs + ".\n"+
                                                        "-> Paste the message below into the new chat: ",
                                                        "**THE MAFIA**  :gun: :dagger:\n"+ 
                                                        "------------------------------------------------------\n"+ paste +
                                                        "------------------------------------------------------\n"+
                                                        "You are the Mafia, you may choose one of you\n"+
                                                        "to perform a Mafia Kill on another player each\n"+   
                                                        "night, this will not replace your role ability.\n\n"+ 
                                                        "If there is an equal number of villagers to\n"+
                                                        "your team or only you are left alive you win.\n\n"+
                                                        "*Please use the following message format:*\n"+
                                                        "***Mafia Kill:***   "+'**"**'+"@'GM' 'killer' Mafia kills 'target'"+'**"**'+"\n"+
                                                        "***Action:***        "+'**"**'+"@'GM' 'MyName' 'action' 'target'"+'**"**'+"\n\n"+
                                                        "*After a warning is given, only the most recent*\n"+
                                                        "*@s to the GM will be considered your decisions*\n"+
                                                        "------------------------------------------------------"))
    }

    gblMessageManager.push(new Message("!GMAction", "-> Declare start of game, allow time for any statements then proceed to the night."))
    gblMessageManager.draw()
    for(var key in gblPlayerDictionary) gblPlayerDictionary[key].draw() 
}

function addPhaseLog(val){
    var x = val ? val : 0;
    var phaseEntry = document.createElement("div");
    phaseEntry.className = "ph glBorder";
    var phaseEntryHeader = document.createElement("Header");
    phaseEntryHeader.className = "phHeader";
    phaseEntryHeader.innerText = phaseText(gblGameCycles + x);
    phaseEntry.appendChild(phaseEntryHeader);
    var phasetext = document.createElement("div");
    phasetext.className = "phText";
    phasetext.innerText = "";
    phaseEntry.appendChild(phasetext);
    document.getElementById("gameLogID").appendChild(phaseEntry);
}

function clearLists(){
    var vlist = document.getElementById('VillageListID');
    var nlist = document.getElementById('NobodyListID');
    var clist = document.getElementById('CultListID');
    var mlist = document.getElementById('MafiaListID');
    var dlist = document.getElementById('DeadListID');
    while (vlist.firstChild) { vlist.removeChild(vlist.firstChild); }
    while (nlist.firstChild) { nlist.removeChild(nlist.firstChild); }
    while (clist.firstChild) { clist.removeChild(clist.firstChild); }
    while (mlist.firstChild) { mlist.removeChild(mlist.firstChild); }
    while (dlist.firstChild) { dlist.removeChild(dlist.firstChild); }
}

function renderGame(){
    if(gblGameCycles & 1) { // NIGHT 
        document.getElementById("gameHeaderDivID").innerHTML = phaseText(gblGameCycles);
        document.getElementById("gameFooterDivID").innerText = "Proceed to " + phaseText(gblGameCycles+1);

        clearLists()
        addPhaseLog()
        for(var key in gblPlayerDictionary) gblPlayerDictionary[key].draw()
        var mlist = document.getElementById("messageListID");
        while (mlist.firstChild) { mlist.removeChild(mlist.firstChild); }

        if(gblPlayerList.returnTargetList("", "Alive Mafia").length > 0) gblMafiaKill.draw()
        var bookie = false;
        for(var key in gblPlayerDictionary) if(gblPlayerDictionary[key].getRole === "Bookie"){
            if(gblPlayerDictionary[key].getBookSuccess && gblPlayerDictionary[key].getBookCycle === gblGameCycles-1) bookie = true;
        }
        if(bookie) gblMafiaKill2.draw()
    }
    else { // DAY
        document.getElementById("gameHeaderDivID").innerHTML = phaseText(gblGameCycles);
        document.getElementById("gameFooterDivID").innerText = "Proceed to " + phaseText(gblGameCycles+1);

        clearLists()
        for(var key in gblPlayerDictionary) gblPlayerDictionary[key].draw()
        var mlist = document.getElementById("messageListID");
        while (mlist.firstChild) { mlist.removeChild(mlist.firstChild); }

        //gblMessageManager.push(new Message("!GMAction", "-> Declare that it is day time."))
        gblMessageManager.draw()
        gblMessageManager.quickRender("-> Declare that it is day time.")
        addPhaseLog()

        //////////////////////////// DRAW LYNCH
        // find out if theres a mayor or a govenor
        var isMayor = "";
        var isGovenor = "";
        for(var key in gblPlayerDictionary){
            if(gblPlayerDictionary[key].getAlive){
                if(gblPlayerDictionary[key].getRole === "Mayor") isMayor = "\n-> Remember that " + key + "'s vote is worth two."
                if(gblPlayerDictionary[key].getRole === "Govenor") isGovenor = "\n-> Check if " + key + " wants to veto the vote."
            }
        }
        // build div
        var entry = document.createElement('li');
        document.getElementById("messageListID").appendChild(entry);
        entry.className = "lis glBorder";
        var name = document.createElement('div');
        name.className = "list-return";
        name.innerText = "The Village has decided to lynch: " + isMayor + isGovenor;
        entry.appendChild(name);

        // build selection
        var targSelect = document.createElement('select');
        targSelect.className = "form select tg-ico mrlp5";
        var tl = gblPlayerList.returnTargetList()
        for(var i=0; i<tl.length; i++){ targSelect.add(new Option(tl[i])); }
        targSelect.selectedIndex = 0;
        entry.appendChild(targSelect)

        // run govenor veto
        if(isGovenor !== ""){
            var vetoButton = document.createElement('button');
            entry.appendChild(vetoButton);
            vetoButton.className = "btn btn-add mrlp5";
            vetoButton.innerText = "Veto?";
            vetoButton.onclick = function (){
                var div = this.parentElement;
                var victim = div.children[1].value;
                if(victim !== "Nobody"){
                    while(div.children.length > 1) div.removeChild(div.lastChild)
                    gblMessageManager.push(new Message("!GMAction", "The villages vote to lynch " + victim +" was vetoed, proceed to night phase."))
                    gblMessageManager.push(new Message("!GameLog", "The Govenor vetoed the lynch vote on " + victim + "."))
                    div.remove()
                    gblMessageManager.draw()
                }
            }
        }
        // execute lynch
        var lynchButton = document.createElement('button');
        entry.appendChild(lynchButton);
        lynchButton.className = "btn btn-run mrlp5";
        lynchButton.innerText = "Lynch";
        lynchButton.onclick = function (){
            var div = this.parentElement;
            var victim = div.children[1].value;
            gblMessageManager.push(new Message("!GMAction", "-> The village voted to lynch "+ victim +", proceed to night phase."))
            gblPlayerDictionary[victim].lynch()
            var booking = gblActionManager.find((act) => act.getName === "Book")
            /*if(booking){
                if(booking.getTarget === victim){
                    for(var key in gblPlayerDictionary) {
                        if(gblPlayerDictionary[key].getRole === "Bookie") {
                            gblPlayerDictionary[key].setBooking = gblGameCycles;
                            gblMessageManager.push(new Message("!GameLog", key +"'s booking was successful, the mafia may perform 2 kills tonight."))
                        }
                        if(gblPlayerDictionary[key].getRole === "Lyncher") {
                            if(gblPlayerDictionary[key].target === victim){
                                const {ipcRenderer} = require('electron');
                                ipcRenderer.send('request-gameover-window')
                            }
                        }
                    }
                }
            }*/
            if(gblPlayerDictionary[victim].getRole === "Fool") {
                const {ipcRenderer} = require('electron');
                ipcRenderer.send('request-gameover-window', {name: victim, role: "Fool", message: "them being lynched by the Village."})
                gblMessageManager.push(new Message("!GameLog", victim +" wins the game, because the village lynched them."))
            }
            for(var key in gblPlayerDictionary) {
                if(gblPlayerDictionary[key].getRole === "Bookie") {
                    if(booking){
                        if(booking.getTarget === victim){
                            gblPlayerDictionary[key].setBooking = gblGameCycles;
                            gblMessageManager.push(new Message("!GameLog", key +"'s booking was successful, the mafia may perform a bonus kill tonight."))
                        }
                    }
                }
                if(gblPlayerDictionary[key].getRole === "Lyncher") {
                    if(gblPlayerDictionary[key].target === victim){
                        const {ipcRenderer} = require('electron');
                        ipcRenderer.send('request-gameover-window', {name: key, role: "Lyncher", message: "the Village lynching "+ victim +" who was their target."})
                        gblMessageManager.push(new Message("!GameLog", key +" wins the game, because the village lynched their target."))
                    }
                }
            }
            var deaths = gblActionManager.filter((act) => act.getName === "Death");
            for(var i=0; i<deaths.length; i++){ 
                deaths[i].runAction()
                gblActionManager.remove(deaths[i])
            }
            div.remove()
            gblMessageManager.draw()
            clearLists()
            for(var key in gblPlayerDictionary) gblPlayerDictionary[key].draw()
        }
        var removeButton = document.createElement('button');
        entry.appendChild(removeButton);
        removeButton.className = "btn btn-remove mrlp5 fg1";
        removeButton.innerText = "Remove";
        removeButton.onclick = function() { 
            this.parentElement.remove()
            gblMessageManager.push(new Message("!GMAction", "-> The village did not want to lynch anybody. Proceed to night phase."))
            gblMessageManager.push(new Message("!GameLog", "The village did not want to lynch anybody."))
            gblMessageManager.draw()
            clearLists()
            for(var key in gblPlayerDictionary) gblPlayerDictionary[key].draw()
        }
    }
}

function runGameCycle(){
    if(gblGameCycles & 1) {// night cycle
        for(var key in gblPlayerDictionary){
            gblPlayerDictionary[key].transferActionSelection()
        }
        
        if(document.getElementById("!MafiaACID")) {
            if(document.getElementById("!MafiaACID").value !== "No Action" && gblMafiaKill.getActions.contains("Mafia Kill")) {
                var TGS = document.getElementsByName("!MafiaTGID");
                var act = gblMafiaKill.getActions.returnContains("Mafia Kill");
                act.setOwner = document.getElementById("!MafiaACID").value;
                act.setTarget = TGS[0].value;
                gblMafiaKill.actionTransfer(act)
            }
        }
        if(document.getElementById("!MafiaDoubleACID")) {
            if(document.getElementById("!MafiaDoubleACID").value !== "No Action" && gblMafiaKill.getActions.contains("Mafia Kill")) {
                var TGS = document.getElementsByName("!MafiaDoubleTGID");
                var act = gblMafiaKill.getActions.returnContains("Mafia Kill");
                act.setOwner = document.getElementById("!MafiaDoubleACID").value;
                act.setTarget = TGS[0].value;
                gblMafiaKill2.actionTransfer(act)
            }
        }
        gblActionManager.push(new VisitAlloc)
        ////////////////////////////////////// action compile
        executeActions()
    } else {
        // day cycle
        executeActions()
    }
    gblGameCycles++;
    renderGame()
}

function executeActions() {
    var action = gblActionManager.lowest();
    while(action) {
        action.runAction()
        gblActionManager.remove(action)
        action = gblActionManager.lowest();
    }
    var i = gblActionManager.length;
    while(i--) gblActionManager[i].cycleDelay = 1;
    for(var key in gblPlayerDictionary) gblPlayerDictionary[key].reset()
    gblMafiaKill.reset()
    gblMafiaKill2.reset()
}

function checkWinCondition() {
    
}