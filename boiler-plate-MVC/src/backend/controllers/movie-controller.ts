import { toPascalCase } from "../../utils/manip-str/index";
import { transformValOf } from "../modules/transform-values-of";
import MovieModel from "../models/movie-models";

export class MovieController {
  private movieModel: MovieModel;

  constructor(movieModel: MovieModel) {
    this.movieModel = movieModel;
  }

  // browse all movies
  listMovies(req: any, res: any): void {
    try {
      this.movieModel.listAllMovies((err: any, rows: any) => {
        if (err) {
          /* directly exposing error details from the server, especially those originating from a database,
            can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
            In addition, a generic error message is more user-friendly */
          console.error("SQL query error: ", err.message);
          return res.status(500).json({ error: "Internal server error." });
        }
        if (rows && rows.length) {
          console.log("List of movies sent to Front-End: ", rows);
          return res.status(200).json({ success: "Movie list: ", list: rows });
        } else {
          return res.status(201).json({
            conflict: "Sorry, we've no movies available at the moment.",
          });
        }
      });
    } catch (error: any) {
      console.error("An error occurred:", error.message);
      res.status(501).json({ error: "Internal server error." });
    }
  }

  // CRUD - Create
  addMovie(req: any, res: any): void {
    const { title, cast, category } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Movie title is required." });
    }
    this.movieModel.addMovie(
      { title, cast, category },
      (err: any, resultset: any) => {
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
            conflict:
              "This movie already exists. Please try a different title.",
          });
        }
      },
    );
  }

  // CRUD - Read
  readMovie(req: any, res: any) {
    const title: string = req.params.name;
    if (!title) {
      return res.status(400).json({ error: "Movie title is required." });
    }

    this.movieModel.read(title, (err: any, rows: any) => {
      if (err) {
        /* directly exposing error details from the server, especially those originating from a database,
        can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
        In addition, a generic error message is more user-friendly */
        console.error("SQL query error: ", err.message);
        return res.status(500).json({ error: "Internal server error." });
      }
      if (rows && rows.length) {
        console.log("Movie found: ", rows);
        return res.status(200).json({
          success: "We found the movie you wanted: ",
          movie: rows,
        });
      } else {
        return res.status(404).json({
          message: "Sorry, this movie is not in store at the moment.",
        });
      }
    });
  }

  // CRUD - Update
  updateMovie(req: any, res: any): void {
    const pascal_case_req = transformValOf(req.body, toPascalCase);
    const { title, cast, category } = pascal_case_req;

    if (!title) {
      return res.status(400).json({ error: "Movie title is required." });
    }

    this.movieModel.update(
      { title, cast, category },
      (err: any, resultset: any) => {
        if (err) {
          /* directly exposing error details from the server, especially those originating from a database,
            can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
            In addition, a generic error message is more user-friendly */
          console.error("SQL query error: ", err.message);
          return res.status(500).json({ error: "Internal server error." });
        }
        if (resultset && resultset.length) {
          console.log("Movie updated in DB: ", resultset);
          return res
            .status(200)
            .json({ success: "Movie successfully updated.", movie: resultset });
        } else {
          // in case the movie doesn't exist, the `OUTPUT` doesn't get executed, ie. result set is null
          return res.status(404).json({
            message: "Sorry, this movie is not in store at the moment.",
          });
        }
      },
    );
  }

  // CRUD - Delete
  deleteMovie(req: any, res: any): void {
    const title = req.params.name;
    if (!title) {
      return res.status(400).json({ error: "Movie title is required." });
    }

    this.movieModel.deleteByTitle(title, (err: any, resultset: any) => {
      if (err) {
        console.error("SQL query error: ", err.message);
        return res.status(500).json({ error: "Internal server error." });
      }
      if (resultset && resultset.length) {
        console.log("Movie deleted in DB: ", resultset);
        return res
          .status(200)
          .json({ success: "Movie successfully deleted.", movie: resultset });
      } else {
        return res.status(201).json({
          conflict: "Sorry, this movie is not in store at the moment.",
        });
      }
    });
  }
}
