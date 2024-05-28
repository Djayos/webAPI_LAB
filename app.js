const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;
const secretKey = 'teubner';

app.use(bodyParser.json());

// Middleware pour loguer toutes les requêtes
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

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

    if (event.ref === 'refs/heads/main') { 
        exec('git pull && npm install && npm run build', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing build: ${error}`);
                console.error(stderr);
                return res.status(500).send(`Internal Server Error: ${error.message}`);
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
