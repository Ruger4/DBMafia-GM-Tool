const electron = require('electron');
const url = require('url');
const path = require('path');

let win = null;
//let consoleWin = null;

const{app, BrowserWindow, Menu, ipcMain} = electron;

// SET ENV
process.env.NODE_ENV = 'proto';

// listen for app to be ready
app.on('ready', function(){
    // Create new window
    if(process.env.NODE_ENV == 'production'){
        win = new BrowserWindow({
            width: 680,
            height: 600,
            frame: false
        });
    } else {
        win = new BrowserWindow({ 
            width: 680, 
            height: 600 
        });
    }
    // load html into window
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol:'file:',
        slashes: true
    }));
    // Quit app when closed
    win.on('closed', function(){
        app.quit();
    });

    // build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // insert menu
    Menu.setApplicationMenu(mainMenu);

    win.on('closed', () => {
        win = null
    })
});

// Catch item:add
ipcMain.on('consoleString', function(e, item){
    alert(item)
    //mainWindow.webContents.send('item:add',item);
    //addWindow.close();
})

/*// Handle creat add window
function createConsoleWin(){
    // Create new window
    consoleWin = new BrowserWindow({
        width: 400,
        height: 300,
        title: 'Console'
    });
    // load html into window
    consoleWin.loadURL(url.format({
        pathname: path.join(__dirname, 'consoleWindow.html'),
        protocol:'file:',
        slashes: true
    }));
    // garbage collection handle
    consoleWin.on('close', function(){
        consoleWin = null;
    });
}*/

// create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];

// if mac, add empty object to menu
if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({});
}

// add developer tools item if not in production
if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu:[
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload',
                accelerator: process.platform == 'darwin' ? 'command+R' : 'Ctrl+R',
            }
        ]
    });
}