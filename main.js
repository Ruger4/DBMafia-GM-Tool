const electron = require('electron');
const url = require('url');
const path = require('path');

let mainWindow, consoleWin, gameoverWin, quitWin;

const{app, BrowserWindow, Menu, ipcMain, globalShortcut} = electron;

// SET ENV
process.env.NODE_ENV = 'proto';

// listen for app to be ready
app.on('ready', function(){
    // Create new window
    if(process.env.NODE_ENV == 'production'){
        mainWindow = new BrowserWindow({
            width: 680,
            height: 600,
            frame: false
        });
    } else {
        mainWindow = new BrowserWindow({ 
            width: 680, 
            height: 600,
            show: false
        });
    }
    // load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol:'file:',
        slashes: true
    }));
    // Quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });

    // build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // insert menu
    Menu.setApplicationMenu(mainMenu);

    globalShortcut.register('Escape', () => { 
        if(!quitWin) createQuitWin()
    })

    createGameoverWin()

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.on('closed', () => {
        mainWindow = null;
        consoleWin = null;
        gameoverWin = null;
        quitWin = null;
    })
});

ipcMain.on('console-string', (e, arg) => { mainWindow.webContents.send('console-string', arg) })
ipcMain.on('console-function-return', (e, arg) => { consoleWin.webContents.send('console-function-return', arg) })
ipcMain.on('request-console-window', (e) => { if(!consoleWin) createConsoleWin() })
ipcMain.on('request-gameover-window', (e, arg) => { 
    gameoverWin.show()
    gameoverWin.webContents.send('gameover-conditions', arg)
})
ipcMain.on('return-to-playerlist', (e) => { mainWindow.webContents.send('return-to-playerlist') })
ipcMain.on('quit-app', (e) => { app.quit() })
ipcMain.on('hide-gameover', (e) => { gameoverWin.hide() })

// Handle creat add window
function createConsoleWin(){
    // Create new window
    consoleWin = new BrowserWindow({ width: 550, height: 330, frame: false});
    consoleWin.title = "Console";
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
}

function createGameoverWin(){
    // Create new window
    gameoverWin = new BrowserWindow({   width: 400, 
                                        height: 140, 
                                        frame: false,
                                        show: false, 
                                        parent: mainWindow});
    gameoverWin.title = "Console";
    // load html into window
    gameoverWin.loadURL(url.format({
        pathname: path.join(__dirname, 'gameoverWindow.html'),
        protocol:'file:',
        slashes: true
    }));

    // garbage collection handle
    gameoverWin.on('close', function(){
        gameoverWin = null;
    });
}

function createQuitWin(){
    // Create new window
    quitWin = new BrowserWindow({ width: 300, height: 60, frame: false, parent: mainWindow});
    quitWin.title = "Console";
    // load html into window
    quitWin.loadURL(url.format({
        pathname: path.join(__dirname, 'quitWindow.html'),
        protocol:'file:',
        slashes: true
    }));
    // garbage collection handle
    quitWin.on('close', function(){
        quitWin = null;
    });
}

// create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'command+Q' : 'Ctrl+Q',
                click(){
                    //app.quit();
                    createQuitWin()
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