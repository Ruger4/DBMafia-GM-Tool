function gameSetup(){
    // create and push game setup parent div
    var gameSetupDiv = document.createElement("div");
    gameSetupDiv.id = "gameSetupID";
    document.getElementById('main').appendChild(gameSetupDiv);

    // create game setup div with text
    var returnToPSDiv = document.createElement("div");
    returnToPSDiv.className = "game-div";

    var texthdiv = document.createElement("div");
    texthdiv.className = "text";
    texthdiv.innerText = "Set Player Roles or:";
    returnToPSDiv.appendChild(texthdiv);

    // create and push return to player setup button to div
    var returnToPSBtn = document.createElement('button');
    returnToPSBtn.className = "btn btn-remove mrlp5";
    returnToPSBtn.innerText = "Return to player setup";
    returnToPSBtn.onclick = function(){
        document.getElementById('main').removeChild(document.getElementById('gameSetupID'));
        playerSetup();
    }
    returnToPSDiv.appendChild(returnToPSBtn);

    if(process.env.NODE_ENV != 'production'){////////////////////////////////////////////////////////////////////////////////
        var testbtn  = document.createElement('button');
        testbtn.innerText = "test roles";
        testbtn.onclick = function(){
            var vills = nsVillagers.clone();
            var mafs = nsMafia.clone();
            var thirds = nsThirds.clone();
            var v = [];
            var m = []; 
            var t = [];
            
            while(v.length < 7){
                var x = vills[Math.floor(Math.random() * vills.length)];
                v.push(x)
                vills.remove(x)
            }
            while(m.length < 2){
                var x = mafs[Math.floor(Math.random() * mafs.length)];
                m.push(x)
                mafs.remove(x)
            }
            t.push(thirds[Math.floor(Math.random() * thirds.length)])

            var temp = v.concat(m, t);
            for(var i=0;i<gblPlayerList.length;i++){
                document.getElementById("RSL" + gblPlayerList[i]).value = temp[i];
            }
        };
        returnToPSDiv.appendChild(testbtn);
    }////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // push div to parent
    gameSetupDiv.appendChild(returnToPSDiv)

    // create and push player list
    var nameList = document.createElement("ol");
    nameList.className = "ol";
    gameSetupDiv.appendChild(nameList);

    // build role dropmenu array
    var roleDropList = nsVillagers.clone().concat(nsMafia.clone(), nsThirds.clone());
    roleDropList.sort()
    roleDropList.unshift("--------------------")

    // create and push players to name list
    for(var i=0;i<gblPlayerList.length;i++){
        // create li box
        var entry = document.createElement('li');
        entry.className = "li";

        // push name to li
        var item = document.createElement('div');
        item.className = "list-name";
        item.innerText = gblPlayerList[i];
        entry.appendChild(item);

        // create and push drop menu
        var select = document.createElement('select');
        select.className = "form select dm-ico mrlp5";
        select.id = "RSL" + gblPlayerList[i];
        for(var j=0; j<roleDropList.length; j++){
            select.options[j] = new Option(roleDropList[j]);
        };
        entry.appendChild(select);

        if(process.env.NODE_ENV != 'production'){////////////////////////////////////////////////////////////////////////////
            var testbtn  = document.createElement('button');
            testbtn.innerText = "RSL" + gblPlayerList[i];
            testbtn.onclick = function(){
                var x = document.getElementById(this.innerText);
                x.selectedIndex = Math.floor(Math.random() * roleDropList.length);
            };
            entry.appendChild(testbtn);
        }////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        // push entry to player list
        nameList.appendChild(entry);
    }

    // create game start game div
    var startGameDiv = document.createElement("div");
    startGameDiv.className = "game-div";

    // create and push start button to div
    var startGameBtn = document.createElement('button');
    startGameBtn.className = "btn btn-run mrlp5";
    startGameBtn.innerText = "Start the game";
    startGameBtn.setAttribute('onClick', 'buildDictionary()');
    startGameDiv.appendChild(startGameBtn);

    // create and push error field
    var errorField = document.createElement("div");
    errorField.className = "text-Red";
    errorField.id = "startGameErrorField";
    startGameDiv.appendChild(errorField);

    // push start game div to game setup div
    gameSetupDiv.appendChild(startGameDiv);
}

function buildDictionary(){
    // reset game variables
    gblActionManager = [];
    gblMessageManager.clear();
    gblGameCycles = 0;
    // proceed
    var errorField = document.getElementById('startGameErrorField')
    errorField.innerText = "";
    gblPlayerDictionary = {};
    for(var i=0;i<gblPlayerList.length;i++){
        var selectVal = document.getElementById("RSL" + gblPlayerList[i]).value;
        if(selectVal == "--------------------"){
            errorField.innerText = "ERROR: " +gblPlayerList[i]+ " has no role assigned!";
            return
        } else if(i > 0){
            for(var key in gblPlayerDictionary){
                if(gblPlayerDictionary[key].getRole === selectVal){
                    errorField.innerText = "ERROR: " +key+ " and " +gblPlayerList[i]+ " have the same role assigned!";
                    return
                }
            }
        }
        gblPlayerDictionary[gblPlayerList[i]] = new nsRoles[selectVal](gblPlayerList[i]);
    }
    document.getElementById('main').removeChild(document.getElementById('gameSetupID'));

    for(var key in gblPlayerDictionary){
        // run sub-constructor
        gblPlayerDictionary[key].init()
    }

    runGame()
}