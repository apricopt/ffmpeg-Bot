const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const async = require('async');
const { SendMessageToDiscord } = require('./hook/discord');

// Set the ffmpeg binary path
ffmpeg.setFfmpegPath(ffmpegPath);

// Read configuration from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const {
  inputVideo,
  inputImageDir,
  outputDir,
  scaleFactor,
  overlayOpacity,
  overlayPosition
} = config;

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to process a single file
const processFile = (file, callback) => {
  if (path.extname(file) !== '.png') {
    return callback(); // Skip non-PNG files
  }

  const baseName = path.basename(file, '.png');
  const inputImage = path.join(inputImageDir, file);
  const outputVideo = path.join(outputDir, `${baseName}_output.mp4`);

  console.log(`Starting processing for ${file}...`);
  
  ffmpeg(inputVideo)
    .input(inputImage)
    .complexFilter([
      {
        filter: 'scale',
        options: `iw*${scaleFactor}:ih*${scaleFactor}`,
        inputs: '1:v',
        outputs: 'scaled'
      },
      {
        filter: 'format',
        options: 'rgba',
        inputs: 'scaled',
        outputs: 'rgba'
      },
      {
        filter: 'colorchannelmixer',
        options: `aa=${overlayOpacity}`,
        inputs: 'rgba',
        outputs: 'ovr'
      },
      {
        filter: 'overlay',
        options: {
          x: overlayPosition.x,
          y: overlayPosition.y
        },
        inputs: ['0:v', 'ovr'],
        outputs: 'final'
      }
    ])
    .outputOptions(['-map', '[final]'])
    .output(outputVideo)
    .on('end', () => {
      console.log(`Processed ${file} and saved to ${outputVideo}`);
      callback();
    })
    .on('error', (err) => {
      console.error(`Error processing ${file}:`, err.message);
      callback(err);
    })
    .run();
};

// Loop through all PNG files in the input image directory
fs.readdir(inputImageDir, (err, files) => {
  if (err) {
    console.error('Error reading input image directory:', err);
    return;
  }

  async.eachSeries(files, processFile, (err) => {
    if (err) {
      console.error('Error processing files:', err);
    } else {
      console.log('Processing complete. All videos have been saved.');
      SendMessageToDiscord("Processing complete. All videos have been saved in the output directory.");
    }
  });
});