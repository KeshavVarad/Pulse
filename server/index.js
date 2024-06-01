import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import { VerifyToken } from "./middleware/VerifyToken.js";

import userRoute from "./routes/userRoutes.js"
import practicalRoute from "./routes/practicalRoutes.js"
import commentRoute from "./routes/commentRoutes.js"

dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(VerifyToken);

app.use('/api', userRoute);
app.use('/api', practicalRoute);
app.use('/api', commentRoute);


app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

