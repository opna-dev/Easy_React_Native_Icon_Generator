const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const appConfig = require("./config.js");
const {
  productionSource,
  betaSource,
  tempOutputDir,
  buildiOSIcons
} = appConfig

const utility = require("./utility.js");
const { clearFolder } = utility;

let iosContentsTempOutputDir = tempOutputDir + "/iosContentsJSON/"
let iosIconTempOutput = tempOutputDir + "/iosIcons/"

let iosDestination = path.resolve(__dirname, "../../ios/" + appConfig.projectName + "/Images.xcassets/");
let iosImageDestinationDir = iosDestination + '/AppIcon.appiconset/'
let iosContentsJsonUrl = iosDestination + '/AppIcon.appiconset/Contents.json';

// init storage variables
// ios Contents.json file will be copied and manipulated in our script using this variable
let iOSIconSetJSON = null;

let config = {
  iosMode: true,
  androidMode: true,
  iosBaseFilname: "AppIcon",
  iosOutputJSONFilename: "Contents.json"
}

// Just handle production for now
let generateIOSIconsFromSource = (devMode) => {
  return new Promise((resolve, reject) => {
    console.log("Gerate iOS icons from source");
    // grab source image before starting
    let sourceFile = productionSource
    if(devMode) { sourceFile = betaSource }
    let sourceImage = fs.readFileSync(sourceFile);
    // pull sizes out of iOS JSON
    let completeCount = 0;
    iOSIconSetJSON.images.forEach((eachImgConfig, i) => {
      // console.log(eachImgConfig);
      let sizeString = eachImgConfig.size;
      let height = sizeString.split("x")[0];
      let width = sizeString.split("x")[1];
      let scale = eachImgConfig.scale.split("")[0];
      let scaledWidth = width * scale;
      let scaledHeight = height * scale;
      let thisNewFilename = config.iosBaseFilname + scaledWidth + "x" + scaledHeight + ".png";
      let outputFileName = iosIconTempOutput + "/" + thisNewFilename
      // handle image processing
      sharp(sourceImage)
      .resize(scaledWidth, scaledHeight)
      .toFile(outputFileName, (err, info) => {
        if (err) reject(err);
        console.log("Resize success: ", thisNewFilename);
        // write file name into temp json
        iOSIconSetJSON.images[i].filename = thisNewFilename
        // increment count and then resolve!!
        completeCount++;
        if (completeCount === iOSIconSetJSON.images.length) resolve();
      });
    });
  });
};

let writeiOSContentsJson = () => {
  return new Promise((resolve, reject) => {
    let fileName = config.iosOutputJSONFilename;
    let tempOutputFile = iosContentsTempOutputDir + fileName;
    fs.writeFileSync(tempOutputFile, JSON.stringify(iOSIconSetJSON, null, 2));
    console.log("Temporarily copying " + fileName + " to edit later");
    resolve();
  });
};

let getIOSIconSetContentsJson = () => {
  return new Promise((resolve, reject) => {
    let contentsJsonUTF8 = fs.readFileSync(iosContentsJsonUrl, 'utf8');
    let contentsJSON = JSON.parse(contentsJsonUTF8)
    // console.log('contents json', contentsJSON)
    if(!contentsJSON) reject();
    resolve(contentsJSON)
  })
}


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////


let copyImagesToDestinationIOS = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(iosIconTempOutput, (err, items) => {
      if (err) {
        reject(err)
      }
      completeCount = 0;
      for ( let i = 0; i < items.length; i++ ) {
        let eachItem = items[i];
        let thisItemFullSourceUrl = iosIconTempOutput + eachItem
        let thisItemFullDestinationUrl = iosImageDestinationDir + '/' + eachItem
        // copy files to destination
        let writeStream = fs.createWriteStream(thisItemFullDestinationUrl)
        let readStream = fs.createReadStream(thisItemFullSourceUrl)
        writeStream.on('close', () => {
          console.log("Successfully copied " + eachItem + " to xCode icon location")
          completeCount++;
          if(completeCount === items.length) {
            resolve()
          }
        })
        readStream.on('end', () => {
          writeStream.close()
        });
        readStream.pipe(writeStream)
      }
    });
  })
};

let copyiOSJsonDataToDestination = () => {
  return new Promise((resolve, reject) => {
    let tempSource = iosContentsTempOutputDir + config.iosOutputJSONFilename
    let iosDest = iosContentsJsonUrl
    let readStream = fs.createReadStream(tempSource)
    let writeStream = fs.createWriteStream(iosDest)
    writeStream.on('close', () => {
      console.log('Successfully overwrote Contents.json in xcode')
      resolve()
    })
    readStream.on('end', () => {
      writeStream.close()
    });
    readStream.pipe(writeStream)
  })
}

let copyAllIOSData = () => {
  return new Promise((resolve, reject) => {
    copyImagesToDestinationIOS()
    .then(copyiOSJsonDataToDestination)
    .then(() => resolve())
  })
}

const makeIOSIcons = (devMode) => {
  return new Promise((resolve, reject) => {
    if(!buildiOSIcons) {
      resolve();
      return;
    }
    getIOSIconSetContentsJson()
    .then((contentsJSON) => {
      iOSIconSetJSON = contentsJSON
      return clearFolder(iosIconTempOutput)
    })
    .then(() => generateIOSIconsFromSource(devMode))
    .then(writeiOSContentsJson)
    .then(copyAllIOSData)
    .then(() => clearFolder(iosIconTempOutput))
    .then(() => clearFolder(iosContentsTempOutputDir))
    .then(() => {
      console.log('======================== Done with iOS ========================')
      resolve()
    })
    .catch((err) => {
      console.log('Error', err)
      reject(err)
    });
  })
}

module.exports = {
  makeIOSIcons
}
