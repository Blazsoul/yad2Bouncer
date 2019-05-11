/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import electron, { app, BrowserWindow, Tray, ipcMain, Menu } from 'electron';
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import MenuBuilder from './menu'
const path = require('path')
const puppeteer = require('puppeteer')
const rimraf = require("rimraf");

const iconpath = path.join(__dirname, 'icon.png') // path of y
let interval = 0

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 600,
    height: 600
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  //Tray
  let appIcon = new Tray(iconpath);
  appIcon.on('double-click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    })
  let contextMenu = Menu.buildFromTemplate([
      {
          label: 'Show App', click: function () {
              mainWindow.show()
          }
      },
      {
          label: 'Quit', click: function () {
              app.isQuiting = true
              app.quit()
          }
      }
  ])
  appIcon.setContextMenu(contextMenu)
  mainWindow.on('minimize', function (event) {
  event.preventDefault()
  mainWindow.hide()
})

mainWindow.on('show', function () {
    appIcon.setHighlightMode('always')
})



  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
});

const initScrape = async(payload) => {
  mainWindow.webContents.send('progress', "Starting script...")
  await bounceAllAds(payload);
  mainWindow.webContents.send('progress', 'Done!')
  mainWindow.webContents.send('done', payload.timeInMs)
};

// // Catch login form
ipcMain.on('authPayload', async (e, payload) => {
  console.log('payloadAfter!', payload)
  clearInterval(interval)
  // await initScrape(payload);
  mainWindow.webContents.send('done', payload.timeInMs)
  interval = setInterval(initScrape, payload.timeInMs)
})

ipcMain.on('stop', async (e) => {
  console.log('stop!')
  clearInterval(interval)
  mainWindow.webContents.send('progress', 'Stopped')
})

ipcMain.on('runNow', async (e, payload) => {
  console.log('runNow!', payload)
  clearInterval(interval)
  await initScrape(payload)
  mainWindow.webContents.send('done', payload.timeInMs)
  interval =  setInterval(() => initScrape(payload), payload.timeInMs)

})

ipcMain.on('clearUserData', async (e, payload) => {
  console.log('clearUserData!')
  rimraf.sync("./user_data");

})
//#######################yad2BouncerFunc#####################################

const bounceAllAds = async (payload) => {
  const bounceAdsInCatalog = async () => {
      let ads = await page.$$('.item');
      return ads.map(async ad => {
          let adSiblingDataFrame = await page.evaluate(adElem => adElem.nextElementSibling.getAttribute('data-frame'), ad);
          await Promise.all([
              page.evaluate(adElem => adElem.click(), ad),
              // ad.click(),
              page.waitForFunction(`document.querySelector('[src="${adSiblingDataFrame}"]') && document.querySelector('[src="${adSiblingDataFrame}"]').contentWindow.document.querySelector('#editOrderBtn')`),
          ]);
  
          let iframe = await page.$(`[src="${adSiblingDataFrame}"]`);
          let iframeContent = await iframe.contentFrame();
          // let bounceDivId = 'editOrderBtn';
          let bounceDivId = 'bounceRatingOrderBtn';
          let bounceBtn = await iframeContent.$(`#${bounceDivId}`);
          if(!bounceBtn) {
              return;
          }
          // await iframeContent.evaluate(bounceBtn1 => bounceBtn1.setAttribute('data-viewcommandactive', "1"), bounceBtn);
          await Promise.all([
              iframeContent.evaluate(bounceBtn => bounceBtn.click(), bounceBtn),
              // bounceBtn.click(),
              page.waitForFunction(`document.querySelector('[src="${adSiblingDataFrame}"]') && document.querySelector('[src="${adSiblingDataFrame}"]').contentWindow.document.querySelector('#${bounceDivId}') && document.querySelector('[src="${adSiblingDataFrame}"]').contentWindow.document.querySelector('#${bounceDivId}').getAttribute('data-viewcommandactive') === '0'`)
          ]);
      });
  };

  console.log('path?',electron.app && electron.app.getPath('exe'))
  console.log('path?',`C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe`)
  const browser = await puppeteer.launch({
       headless: false,
       userDataDir: "./user_data",
      //  executablePath: electron.app.getPath('exe'),
      //  executablePath: `C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe`,
      //  args: [__filename, '--is-page']
      // args: ["."]
      });
  // const page = await browser.newPage();
  // browser.newPage appears to be unsupported
  // check if pages[] is always populated


  const [page] = await browser.pages();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('https://my.yad2.co.il/login.php');
  const hasToLogin = await page.$('#submitLogonForm');
  if (hasToLogin) {
      let email;
      let pass;
      if(payload) {
          email = payload.email;
          pass = payload.pass;
      }
      await page.type('#userName', email);
      await page.type('#password', pass);
      await Promise.all([
          page.click("#submitLogonForm"),
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      ]);
  }
  let thumbnails = await page.$$('.thumbnailBar_wrap > a');
  // Enters catalog and bounce ads in each Catalog
  for(let i=0;i<thumbnails.length;i++) {
      let thumbnails = await page.$$('.thumbnailBar_wrap > a');
      await Promise.all([
          page.evaluate(elem => elem.click(), thumbnails[i]),
          page.waitForNavigation({ waitUntil: 'domcontentloaded' })
      ]);
      mainWindow.webContents.send('progress', `Bouncing ads in Catalog ${+i+1}...`)
      let adsPrms = await bounceAdsInCatalog();
      await Promise.all(adsPrms).catch(console.log);
      await Promise.all([
          page.goBack(),
          page.waitForFunction(`document.querySelector('.thumbnailBar_wrap > a')`),
      ]);
  }
  await browser.close();
};