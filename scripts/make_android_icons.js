const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const appConfig = require('./config.js');
const {
  tempOutputDir,
  productionSource,
  betaSource,
  androidIconConfig,
  androidIconRootDestination,
  iconName,
  buildAndroidIcons
} = appConfig;

const utility = require("./utility.js");
const { clearFolder } = utility;

let androidIconTempOutput = tempOutputDir + "/androidIcons/"


let createTempDirectories = () => {
  return new Promise((resolve, reject) => {
    androidIconConfig.forEach((elem, i) => {
      let dirToMake = androidIconTempOutput + elem.dir
      console.log('Make temp dir: ', dirToMake)
      fs.mkdirSync(dirToMake)
    })
    resolve()
  })
}

let generateAndroidIconsFromSource = (devMode) => {
  return new Promise((resolve, reject) => {
    let sourceFile = productionSource
    if(devMode) {
      sourceFile = betaSource
    }
    // read source image
    let sourceImage = fs.readFileSync(sourceFile);
    let copyCompletedCount = 0
    // iterate through options
    androidIconConfig.forEach((elem, i) => {
      let thisNewFilename = elem.dir + '/' + iconName;
      let thisFileLocation = androidIconTempOutput;
      let outputFileName = androidIconTempOutput + thisNewFilename
      // // handle image processing
      sharp(sourceImage)
      .resize(elem.resolution, elem.resolution)
      .toFile(outputFileName, (err, info) => {
        if (err) reject(err);
        copyCompletedCount ++;
        console.log("Resize success: ", thisNewFilename);
        if(copyCompletedCount >= androidIconConfig.length) {
          resolve()
        }
      })
    })
  })
}

let copyImagesToDestinationAndroid = () => {
  return new Promise((resolve, reject) => {
    console.log('Copy images to android destination')
    let completeCount = 0
    androidIconConfig.forEach((elem, i) => {
      let thisItemFullSourceUrl = androidIconTempOutput + elem.dir + '/' + iconName
      let thisItemFullDestinationUrl = androidIconRootDestination + '/' + elem.dir + '/' + iconName
      // copy files to destination
      let writeStream = fs.createWriteStream(thisItemFullDestinationUrl)
      let readStream = fs.createReadStream(thisItemFullSourceUrl)
      writeStream.on('close', () => {
        console.log("Successfully copied to android destination: ", elem.dir)
        completeCount++;
        if(completeCount >= androidIconConfig.length) {
          resolve()
        }
      })
      readStream.on('end', () => {
        writeStream.close()
      });
      readStream.pipe(writeStream)
    })
  })
};

const makeAndroidIcons = (devMode) => {
  return new Promise((resolve, reject) => {
    if(!buildAndroidIcons) {
      resolve()
      return;
    }
    console.log('==== Make android icons =====')
    // clearing in the beginning does not really work
    clearFolder(androidIconTempOutput)
    .then(createTempDirectories)
    .then(() => generateAndroidIconsFromSource(devMode))
    .then(copyImagesToDestinationAndroid)
    .then(() => clearFolder(androidIconTempOutput))
    .then((res) => {
      console.log('======================== Done with android ========================')
      resolve()
    })
    .catch((err) => {
      console.log('Error copying android', err)
      reject(err)
    })
  })

}

module.exports = {
  makeAndroidIcons
}
