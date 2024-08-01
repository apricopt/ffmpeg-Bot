require('dotenv').config()
const axios = require('axios');

const webhookUrl = process.env.DISCORD_WEBHOOK;


async function SendMessageToDiscord(message){
    const messagePayload = {
      content: message
    };

    await axios.post(webhookUrl, messagePayload)
    .then(response => {
        console.log('Message sent successfully to Discord with status code of', response.status);
    })
    .catch(error => {
        console.error('Error sending message:', error);
  });

}

module.exports={
    SendMessageToDiscord
}