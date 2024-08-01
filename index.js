const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
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

// Loop through all PNG files in the input image directory
fs.readdir(inputImageDir, (err, files) => {
  if (err) {
    console.error('Error reading input image directory:', err);
    return;
  }

  files.forEach((file) => {
    if (path.extname(file) === '.png') {
      const baseName = path.basename(file, '.png');
      const inputImage = path.join(inputImageDir, file);
      const outputVideo = path.join(outputDir, `${baseName}_output.mp4`);

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
        })
        .on('error', (err) => {
          console.error(`Error processing ${file}:`, err.message);
        })
        .run();
    }
  });
});

console.log('Processing complete. All videos will be saved in the outputs directory.');

SendMessageToDiscord("Processing complete. All videos will be saved in the output directory.")
