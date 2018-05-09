const path = require("path");

// Users can touch this
const projectName = 'icon_generator_test'
const buildiOSIcons = true;
const buildAndroidIcons = true;

const androidIconConfig = [
  {
    dir: "mipmap-hdpi",
    resolution: 72
  },
  {
    dir: "mipmap-mdpi",
    resolution: 48
  },
  {
    dir: "mipmap-xhdpi",
    resolution: 96
  },
  {
    dir: "mipmap-xxhdpi",
    resolution: 144
  }
]

let tempOutputDir = path.resolve(__dirname, "../temp_output/");
let productionSource = path.resolve(__dirname, "../icon_template-assets/production_source_icon.png");
let betaSource = path.resolve(__dirname, "../icon_template-assets/beta_source_icon.png");

// Android specific
let androidIconRootDestination = path.resolve(__dirname, "../../android/app/src/main/res")
let iconName = "ic_launcher.png"

module.exports = {
  projectName,
  buildiOSIcons,
  buildAndroidIcons,
  androidIconConfig,
  tempOutputDir,
  productionSource,
  betaSource,
  androidIconRootDestination,
  iconName
}
