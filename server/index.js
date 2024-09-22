import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path"
import axios from "axios"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


import { VerifyToken } from "./middleware/VerifyToken.js";

import userRoute from "./routes/userRoutes.js"
import practicalRoute from "./routes/practicalRoutes.js"
import commentRoute from "./routes/commentRoutes.js"
import adminRoute from "./routes/adminRoutes.js"
import schoolRoute from "./routes/schoolRoutes.js"
import inviteRoute from "./routes/inviteRoutes.js"

dotenv.config();

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;


const app = express();

app.use(cors());
app.use(express.json());


app.use(express.urlencoded({ extended: false }));
// app.use(VerifyToken);

if (process.env.MODE != "dev") {
    app.use(express.static(path.join(__dirname, "./build")));
}


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.HOST_NAME);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use('/api', userRoute);
app.use('/api', practicalRoute);
app.use('/api', commentRoute);
app.use('/api', adminRoute);
app.use('/api', schoolRoute);
app.use('/api', inviteRoute);

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages,
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).send('Error calling OpenAI API');
    }
});


if (process.env.MODE != "dev") {
    app.get("*", (req, res, next) => {
        res.sendFile(path.join(__dirname, "./build/index.html"))
    })
}



app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

