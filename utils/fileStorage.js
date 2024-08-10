const fs = require('fs');
const path = require('path');

const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file from disk: ${error}`);
    return [];
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(path.resolve(__dirname, filePath), JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file to disk: ${error}`);
  }
};

module.exports = { readJsonFile, writeJsonFile };
