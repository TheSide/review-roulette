const fs = require("fs");
const path = require("path");
const axios = require("axios");
const _difference = require("lodash/difference");
const config = require("../config.js");

const firebaseAdmin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

const serviceAccount = require("./slack-c2ee7-firebase-adminsdk-g5dzi-23f41112f8.json");

const admin = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

const storageRef = admin.storage().bucket(`gs://slack-c2ee7.appspot.com`);

const fileName = "data.json";
const dataFilePath = path.join(__dirname, "..", fileName);

/**
 * Returns an array of user entities found in a string
 * @param {string} str
 */
const extractUserEntities = (str) => {
  const regex = /<@([^>\|]+)[^>]*>/g;
  let match,
    results = [];
  do {
    match = regex.exec(str);
    if (match) {
      results.push(match[1]);
    }
  } while (match !== null);
  return results;
};

/**
 * Returns an group found in a command
 * @param {string} str
 */
const extractGroup = (str) => {
  return str.replace(/<@.*>/g, "").trim().split(" ")[1];
};

/**
 * Loads the data file and returns its contents
 */
// const loadData = async () => {
//   let destFilename = './data.json';
//   const options = {
//     // The path to which the file should be downloaded, e.g. "./file.txt"
//     destination: destFilename,
//   };

//   // Downloads the file
//   await storage.bucket(bucketName).file(filename).download(options);

//   console.log(
//     `gs://${bucketName}/${filename} downloaded to ${destFilename}.`
//   );
// };

const loadData = () => {
  console.log("geee ");
  storageRef.file(fileName).download({
    public: true,
    destination: dataFilePath,
    metadata: {
      firebaseStorageDownloadTokens: uuidv4(),
    },
  });

  try {
    console.log(dataFilePath);
    const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    console.log(data);
    // backupData(data);
    return data;
  } catch (e) {
    if (e.code === "ENOENT") {
      console.log(
        "No data file was found. A new one will be created during the next backup."
      );
    } else {
      console.error("An error occurred during data loading.", e);
    }
    return { teams: {} };
  }
};

/**
 * Saves the given object into the data file
 */
const backupData = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, 0, 2));
  } catch (e) {
    console.error("An error occurred during data backup.", e);
  }
  // Uploads a local file to the bucket
  storageRef.upload(dataFilePath, {
    public: true,
    destination: `${fileName}`,
    metadata: {
      firebaseStorageDownloadTokens: uuidv4(),
    },
  });
};

/**
 * Sends a delayed response to a user or a channel
 * @param {*} commandInfo
 * @param {*} response
 */
const sendDelayedResponse = async (commandInfo, response) => {
  try {
    await axios.post(commandInfo.response_url, response);
  } catch (e) {
    console.error("An error occured while sending the delayed response.", e);
  }
};

/**
 * Calls a Slack Web API method with the given data and options
 * @param {*} method
 * @param {*} data
 * @param {*} options
 */
const callSlackMethod = async (method, data, options = {}) => {
  return await axios({
    method: options.method || "POST",
    url: `https://slack.com/api/${method}`,
    data: data,
    headers: {
      ...(options.bearer ? { authorization: `Bearer ${options.bearer}` } : {}),
    },
  });
};

/**
 * Randomly selects an item in an array not in the other array
 * @param {*} arrayToPick
 * @param {*} arrayToExclude
 */
const getRandomIn = (arrayToPick, arrayToExclude) => {
  if (!arrayToPick.length) {
    return undefined;
  } else {
    const chosenValues = _difference(arrayToPick, arrayToExclude);
    return chosenValues[Math.floor(Math.random() * chosenValues.length)];
  }
};

/**
 * Returns a random Gif from the configuration file
 */
const getRandomGif = () => {
  return config.gifs.length
    ? config.gifs[Math.floor(Math.random() * config.gifs.length)]
    : null;
};

module.exports = {
  extractUserEntities,
  extractGroup,
  loadData,
  backupData,
  sendDelayedResponse,
  getRandomGif,
  getRandomIn,
  callSlackMethod,
};
