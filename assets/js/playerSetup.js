function playerSetup(){
    // create add player setup parent div
    var playerSetupDiv = document.createElement("div");
    playerSetupDiv.id = "playerSetupID";
    document.getElementById('main').appendChild(playerSetupDiv);

    // create add player div with text
    var addPlayerDiv = document.createElement("div");
    addPlayerDiv.className = "game-div";

    var texthdiv = document.createElement("div");
    texthdiv.className = "text";
    texthdiv.innerText = "Add new player:";
    addPlayerDiv.appendChild(texthdiv);

    // add player input form to div
    var addPlayerForm = document.createElement("input");
    addPlayerForm.className = "form mrlp5";
    addPlayerForm.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("addPlayerBtn").click();
        }
    });
    addPlayerDiv.appendChild(addPlayerForm);

    // add submit player button to div
    var addPlayerButton = document.createElement('button');
    addPlayerButton.className = "btn btn-add mrlp5";
    addPlayerButton.id = "addPlayerBtn";
    addPlayerButton.innerText = "Submit";
    addPlayerButton.onclick = function(){
        if(addPlayerForm.value === ""){ addPlayerForm.value = ''; return }
        gblPlayerList.push(addPlayerForm.value);
        addPlayerForm.value = '';
        renderPlayerList();
    };
    addPlayerDiv.appendChild(addPlayerButton);

    if(process.env.NODE_ENV != 'production'){////////////////////////////////////////////////////////////////////////////////
        var testbtn  = document.createElement('button');
        testbtn.innerText = "test list";
        testbtn.onclick = function(){
            var temp = "Alan,Bob,Carl,Dave,Eddy,Frank,Gary,Harry,Ian,James";
            gblPlayerList = temp.split(",");
            //renderPlayerList();
            document.getElementById('main').removeChild(document.getElementById('playerSetupID'));
            gameSetup();
        };
        addPlayerDiv.appendChild(testbtn);
    }////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // push add player div to main
    playerSetupDiv.appendChild(addPlayerDiv);

    // create and push player list
    var nameList = document.createElement("ol");
    nameList.className = "ol";
    nameList.id = "nameList";
    playerSetupDiv.appendChild(nameList);

    // render
    renderPlayerList();
}

function renderPlayerList(){
    // grab the html list
    var list = document.getElementById('nameList');
    // clean it
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }
    // create each li again
    for(var i=0;i<gblPlayerList.length;i++){
        // create li box
        var entry = document.createElement('li');
        entry.className = "li";
        // push name to player list
        var item = document.createElement('div');
        item.className = "list-name";
        item.innerText = gblPlayerList[i];
        entry.appendChild(item);
        // create and push remove button
        var removeButton = document.createElement('button');
        removeButton.className = "btn btn-remove";
        removeButton.innerText = "Remove";
        removeButton.onclick = function(){
            gblPlayerList.remove(this.parentElement.innerText.split(/\r?\n/)[0])
            this.parentElement.remove()
        }
        entry.appendChild(removeButton);
        // push entry to player list
        list.appendChild(entry);
    }
    
    if(gblPlayerList.length > 6 && document.getElementById('playerSetupDivID') == null){
        // create game setup div
        var playerSetup = document.createElement("div");
        playerSetup.className = "game-div";
        playerSetup.id = "playerSetupDivID";

        // create game setup button
        var playerSetupBtn = document.createElement('button');
        playerSetupBtn.className = "btn btn-run mrlp5";
        playerSetupBtn.innerText = "Proceed to Game Setup";
        playerSetupBtn.onclick = function(){
            document.getElementById('main').removeChild(document.getElementById('playerSetupID'));
            gameSetup();
        }
        playerSetup.appendChild(playerSetupBtn);

        // create remove all button
        var removeAllBtn = document.createElement('button');
        removeAllBtn.className = "btn btn-remove mrlp5";
        removeAllBtn.innerText = "Remove all";
        removeAllBtn.onclick = function (){
            gblPlayerList.splice(0,gblPlayerList.length);
            renderPlayerList();
        }
        playerSetup.appendChild(removeAllBtn);

        document.getElementById('playerSetupID').appendChild(playerSetup);

    } else if (gblPlayerList.length < 7 && document.getElementById('playerSetupDivID') !== null){
        var element = document.getElementById('playerSetupDivID');
        element.parentNode.removeChild(element);
    }
}