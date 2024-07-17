import * as express from "express";
const router = express.Router();
import MovieModel from "../models/movie-models";
import * as sql from "msnodesqlv8";

// Initialize database connection
const connectionString =
  "server=ADMINLenovo;Database=OnlineMovieStore;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
sql.open(connectionString, (err, conn) => {
  if (err) {
    console.error("Error connecting to the database: ", err);
    return;
  }

  // Initialize the MovieModel with the database connection
  const movieModel = new MovieModel(conn);

  // Define a POST route for creating a movie
  router.post("/movie", (req, res) => {
    movieModel.create(req.body, (err, resultset) => {
      if (err) {
        /* directly exposing error details from the server, especially those originating from a database,
        can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
        In addition, a generic error message is more user-friendly */
        console.error("SQL query error: ", err.message);
        return res.status(500).json({ error: "Internal server error." });
      }
      if (resultset && resultset.length) {
        console.log("Movie added to DB: ", resultset);
        return res
          .status(200)
          .json({ success: "Movie added successfully.", movie: resultset });
      } else {
        // in case the movie already exists, the `INSERT INTO` + `OUTPUT` don't get executed, ie. result set is null
        return res.status(201).json({
          conflict: "This movie already exists. Please try a different title.",
        });
      }
    });
  });

  // Define a GET route for reading a movie by title
  router.get("/movie/:title", (req, res) => {
    movieModel.read(req.params.title, (err, movie) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error." });
      }
      if (movie) {
        res.status(200).json(movie);
      } else {
        res.status(404).json({ error: "Movie not found." });
      }
    });
  });

  // Add routes for update and delete similarly
});

export default router;
