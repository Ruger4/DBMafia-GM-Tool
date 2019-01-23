class MessageManager {
    constructor(){
        this.consoleLog = [];
        this.gmActions = [];
        this.playerReturns = [];
        this.deathReport = [];
        this.revealReport = [];
        this.itemMoving = [];
    }

    set setDead(player) { if(!this.deathReport.includes(player)) this.deathReport.push(player) }
    set setReveal(player) { if(!this.revealReport.includes(player)) this.revealReport.push(player) }

    push(msg){
        switch (msg.getTarget) {
            case "!GameLog":
                this.consoleLog.push(msg)
                break;
            case "!GMAction":
                this.gmActions.push(msg)
                break;
            default:
                this.playerReturns.push(msg)
                break;
        }
    }
    addItemMsg(player, item){
        this.itemMoving.push({player: player, item: item, give: true})
    }
    removeItemMsg(player, item){
        this.itemMoving.push({player: player, item: item, give: false})
    }

    draw(){
        this.renderConsoleLogs()
        this.renderReturns()
        this.calculateItemMoveMsgs()
        this.calculateDeathMsgs()
        this.renderGmActions()
        this.clear()
        this.pendingCheck()
    }
    clear(){
        this.consoleLog = [];
        this.gmActions = [];
        this.playerReturns = [];
        this.deathReport = [];
        this.revealReport = [];
        this.itemMoving = [];
    }
    pendingCheck(){
        if(document.getElementById("messageListID").childElementCount > 0){
            document.getElementById("messengerDivID").style.display = "";
            document.getElementById("gameFooterDivID").className = "text-Red"
            document.getElementById("gameFooterDivID").innerText = "Perform and remove all pending actions to proceed."
            document.getElementById("calculateButtonID").style.display = "none";
        } else {
            document.getElementById("messengerDivID").style.display = "none";
            document.getElementById("gameFooterDivID").className = "text"
            document.getElementById("gameFooterDivID").innerText = "Assign player requested actions then: "
            document.getElementById("calculateButtonID").style.display = "";
        }
    }
    renderConsoleLogs(){
        var renderloc = document.getElementById("gameLogID").lastElementChild.lastElementChild;
        for(var i=0; i<this.consoleLog.length; i++){
            var msg = this.consoleLog[i];
            if(renderloc.innerText === ""){ renderloc.innerText = msg.getMessage; }
            else { renderloc.innerText += "\n" + msg.getMessage; }
        }
    }
    quickRender(msg){
        var renderloc = document.getElementById("messageListID");
        var entry = document.createElement('li');
        renderloc.appendChild(entry)
        entry.className = "lis glBorder";
        var bodydiv = document.createElement('div');
        entry.appendChild(bodydiv)
        bodydiv.className = "flex-col fg2";
        var name = document.createElement('div');
        bodydiv.appendChild(name)
        name.className = "list-return";
        name.innerText = msg;
        var removeButton = document.createElement('button');
        entry.appendChild(removeButton);
        removeButton.className = "btn btn-remove mrlp5 fg1";
        removeButton.innerText = "Remove";
        removeButton.onclick = function() { 
            this.parentElement.remove()
            pendingCheck()
        }
        pendingCheck()
    }
    renderGmActions(){
        var renderloc = document.getElementById("messageListID");
        for(var i=0; i<this.gmActions.length; i++){
            var msg = this.gmActions[i];
            var entry = document.createElement('li');
            renderloc.appendChild(entry)
            entry.className = "lis glBorder";
            var bodydiv = document.createElement('div');
            entry.appendChild(bodydiv)
            bodydiv.className = "flex-col fg2";
            var name = document.createElement('div');
            bodydiv.appendChild(name)
            name.className = "list-return";
            name.innerText = msg.getMessage;
            if(msg.getPaste !== ""){
                var textdiv = document.createElement('div');
                textdiv.className = "flex-row";
                bodydiv.appendChild(textdiv);
                var text = document.createElement('textarea');
                textdiv.appendChild(text);
                text.className = "textarea"
                text.value = msg.getPaste;
                var copyButton = document.createElement('button');
                textdiv.appendChild(copyButton);
                copyButton.className = "btn btn-add mrlp5";
                copyButton.innerText = "Copy";
                copyButton.onclick = function() { 
                    var copyText = this.parentElement.getElementsByClassName("textarea");
                    copyText[0].select();
                    document.execCommand("copy");
                }
            }
            var removeButton = document.createElement('button');
            entry.appendChild(removeButton);
            removeButton.className = "btn btn-remove mrlp5 fg1";
            removeButton.innerText = "Remove";
            removeButton.onclick = function() { 
                this.parentElement.remove()
                pendingCheck()
            }
        }
    }
    renderReturns(){
        var renderloc = document.getElementById("messageListID");
        for(var i=0; i<this.playerReturns.length; i++){
            var msg = this.playerReturns[i];
            var entry = document.createElement('li');
            renderloc.appendChild(entry)
            entry.className = "lis glBorder";
            var name = document.createElement('div');
            entry.appendChild(name)
            name.className = "list-return fg1";
            name.innerText = "-> To "+ msg.getTarget;
            var text = document.createElement('textarea')
            entry.appendChild(text);
            text.className = "textarea fg2"
            text.value = msg.getMessage;
            var copyButton = document.createElement('button');
            entry.appendChild(copyButton);
            copyButton.className = "btn btn-add mrlp5";
            copyButton.innerText = "Copy";
            copyButton.onclick = function() { 
                var copyText = this.parentElement.getElementsByClassName("textarea");
                copyText[0].select();
                document.execCommand("copy");
            }
            var removeButton = document.createElement('button');
            entry.appendChild(removeButton);
            removeButton.className = "btn btn-remove mrlp5 fg1";
            removeButton.innerText = "Remove";
            removeButton.onclick = function() { 
                this.parentElement.remove()
                pendingCheck()
            }
        }
    }
    calculateDeathMsgs(){
        var msg = "";
        for(var i=0; i<this.deathReport.length; i++){
            var player = this.deathReport[i];
            this.revealReport.includes(player) ? msg = "-> DO NOT turn over " + player + "'s role card but declare them dead." :
            msg = "-> Turn over " + player + "'s role card and declare them dead.";
            this.push(new Message("!GMAction", msg))
        }
    }
    calculateItemMoveMsgs(){
        while(this.itemMoving.length){
            var move = this.itemMoving[0];
            var add = this.itemMoving.filter((act) => act.player === move.player && act.item === move.item && act.give)
            var rem = this.itemMoving.filter((act) => act.player === move.player && act.item === move.item && !act.give)
            var aL,rL,tL;
            add ? aL = add.length : aL = 0;
            rem ? rL = rem.length : rL = 0;
            tL = aL - rL;
            if(tL !== 0 && tL > 0){
                for(var j=0; j<tL; j++) this.push(new Message("!GMAction", "-> Add item: " + move.item + " to " + move.player +"."))  
            } else {
                for(var j=tL; j<0; j++) this.push(new Message("!GMAction", "-> Remove item: " + move.item + " from " + move.player +"."))
            }
            var i = this.itemMoving.length;
            while(i--){
                var x = this.itemMoving[i];
                if(x.player === move.player && x.item === move.item) this.itemMoving.remove(x)
            }
        }
    }
}
class Message {
    constructor(tg, msg, pst){
        this.target = tg ? tg : "";
        this.message = msg ? msg : "";
        this.paste = pst ? pst : "";
    }
    get getTarget() { return this.target }
    get getMessage() { return this.message }
    get getPaste() { return this.paste }
}