import * as express from "express";
const router = express.Router();
import * as sql from "msnodesqlv8";
import MovieModel from "../models/movie-models";
import { MovieController } from "../controllers/movieController";

// Initialize database connection
const connectionString =
  "server=ADMINLenovo;Database=OnlineMovieStore;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
sql.open(connectionString, (err, dbConn) => {
  if (err) {
    console.error("Error connecting to the database: ", err);
    return;
  }

  // Initialize the MovieModel with the database connection
  const movieModel = new MovieModel(dbConn);
  const movieController = new MovieController(movieModel);

  // CRUD - Create
  router.post("/addmovie", (req, res) => movieController.addMovie(req, res));

  // CRUD - Read
  router.get("/readmovie/:name", (req, res) =>
    movieController.readMovie(req, res),
  );

  // CRUD - Update
  router.post("/updatemovie", (req, res) =>
    movieController.updateMovie(req, res),
  );

  // CRUD - Delete
  router.get("/deletemovie/:name", (req, res) =>
    movieController.deleteMovie(req, res),
  );
});

export default router;
