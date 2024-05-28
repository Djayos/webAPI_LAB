const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;
const secretKey = 'teubner';

app.use(bodyParser.json());

function verifyGithubSignature(req, res, next) {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', secretKey);
    const digest = `sha256=${hmac.update(payload).digest('hex')}`;

    if (signature === digest) {
        return next();
    } else {
        console.log('Invalid signature');
        return res.status(401).send('Invalid signature');
    }
}

app.post('/webhook', verifyGithubSignature, (req, res) => {
    const event = req.body;
    console.log('Received event:', event);

    if (event.ref === 'refs/heads/main') {  // assuming you are interested in changes on 'main' branch
        exec('git pull && npm install && npm run build', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing build: ${error}`);
                return res.status(500).send('Internal Server Error');
            }
            console.log(`Build output: ${stdout}`);
            res.status(200).send('Build completed');
        });
    } else {
        res.status(200).send('Event received');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
