import * as express from "express";
const app = express();
import * as bodyParser from "body-parser";
import * as cors from "cors";
import movieRoutes from "./routes/movie-routes";

app.use(cors());
app.use(bodyParser.json());
// Use the movie routes
app.use("/api", movieRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
