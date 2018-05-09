const makeIOSIcons = require('./make_ios_icons.js').makeIOSIcons;
const makeAndroidIcons = require('./make_android_icons.js').makeAndroidIcons;
const appConfig = require('./config.js');
const asciify = require('asciify-image');

console.log("Generate React Native Icons");

// Pull devmode out of command line arguments
let devMode = false
process.argv.forEach((arg, i) => {
  if(arg === '--dev' || arg == '-d') {
    devMode = true
    console.log('DEV / STAGING MODE')
  }
})

// Just for fun
let printAscii = () => {
  return new Promise((resolve, reject) => {
    var options = {
      fit:    'none',
      width:  50,
      height: 45
    }
    let pathToAsciify = appConfig.productionSource
    if(devMode) {
      pathToAsciify = betaSource
    }
    asciify(pathToAsciify, options)
    .then((asciified) => {
      // Print asciified image to console
      console.log(asciified);
      resolve()
    })
    .catch((err) => {
      reject(err)
    });
  })
}

makeIOSIcons(devMode)
.then(() => makeAndroidIcons(devMode))
.then(printAscii)
.then(() => console.log('===== I hope we\'ve made your life a little easier http://www.animallabs.co ====='))
