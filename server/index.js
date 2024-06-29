import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


import { VerifyToken } from "./middleware/VerifyToken.js";

import userRoute from "./routes/userRoutes.js"
import practicalRoute from "./routes/practicalRoutes.js"
import commentRoute from "./routes/commentRoutes.js"

dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();




app.use(cors());
app.use(express.json());


app.use(express.urlencoded({ extended: false }));
// app.use(VerifyToken);

app.use(express.static(path.join(__dirname, "./build")));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://pulse-427901.uc.r.appspot.com");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use('/api', userRoute);
app.use('/api', practicalRoute);
app.use('/api', commentRoute);

app.get("*", (req, res, next) => {
    res.sendFile(path.join(__dirname, "./build/index.html"))
})

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

