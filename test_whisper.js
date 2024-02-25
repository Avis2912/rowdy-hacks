const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const filePath = path.join(__dirname, 'heyy.mp3');
const model = "whisper-1";

const formData = new FormData();
formData.append("model", model);
formData.append("file", fs.createReadStream(filePath));

axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
    headers: {
        Authorization: "Bearer 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",
        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
    },
}).then((response => {
    console.log(response.data);
}));
