import * as express from "express";
const app = express();
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as sql from "msnodesqlv8";

import { transformValOf } from "./modules/transform-values-of";
import { toPascalCase } from "../utils/manip-str/index";

app.use(cors());
app.use(bodyParser.json());

const connectionString =
  "server=ADMINLenovo;Database=OnlineMovieStore;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}"; // SERVERNAME
// CRUD - Create
app.post("/addmovie", (req: any, res: any) => {
  try {
    // capitalize the first letter of each word
    const pascal_case_req: Record<string, string | null> = transformValOf(
      req.body,
      toPascalCase,
    ); // in TypeScript, `Record<string, string | null>` is a utility type that represents an object type with keys of type string and values that can either be of type string or null (https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
    const { title, cast, category } = pascal_case_req;

    // in ER Diagram, "Allow NULL" is set to false for `title`. Ensure it's provided in the request body
    // "" and '' (empty string) are falsy values (https://developer.mozilla.org/en-US/docs/Glossary/Truthy)
    if (!title) {
      return res.status(400).json({ error: "Movie title is required." });
    }
    // check if movie already exists
    const query = `
    IF NOT EXISTS (SELECT 1 FROM Movie WHERE title = ?)
    BEGIN
      INSERT INTO Movie (title, cast, category) OUTPUT INSERTED.* VALUES (?, ?, ?)
    END
  `; /* `SELECT 1` does not retrieve any actual data from the column(s) of the table;
  it simply returns the number `1` for each row that meets the condition.
  The database engine stops scanning as soon as it finds the first matching row.
  Placeholders (?) are positional ie. for `NOT EXISTS`, the first `?` taps into the first element in the array of the parametrised query.
  In index order, the next elements are used for `INSERT INTO`. Since `title` is passed onto both queries, it needs to be repeated.
  In a stored procedure, we could use named parameters e.g. @title https://learn.microsoft.com/en-us/sql/odbc/reference/develop-app/binding-parameters-by-name-named-parameters?view=sql-server-ver16
  
  OUTPUT clause captures inserted attributes to be displayed in the front-end (https://learn.microsoft.com/en-us/sql/t-sql/queries/output-clause-transact-sql?view=sql-server-ver16#a-use-output-into-with-an-insert-statement) */
    sql.query(
      connectionString,
      query,
      [title, title, cast, category],
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
  } catch (err: any) {
    console.error("An error occurred: ", err.message);
    return res.status(501).json({ error: "Internal server error." });
  }
});

// CRUD - Read
app.get("/readmovie/:name", (req: any, res: any) => {
  try {
    // type was already validated in Front-End; defined for clarity
    const title: string = req.params.name;
    // even though the Front-End checks that `name` is not empty, doube-check
    if (!title) {
      return res.status(400).json({ error: "Movie title is required." });
    }
    // `title` passed as a parameter to the query function,
    // rather than directly by using `${title}` to prevent SQL injection aka  parameterized query
    const movie_query =
      "SELECT title, cast, category FROM Movie WHERE title COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ?"; // CI_AS (Case Insensitive, Accent Sensitive). A collation is a set of rules for comparing characters in a string.
    sql.query(connectionString, movie_query, [title], (err: any, rows: any) => {
      if (err) {
        // directly exposing error details from the server, especially those originating from a database,
        // can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
        // In addition, a generic error message is more user-friendly
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
        return res.status(201).json({
          conflict: "Sorry, this movie is not in store at the moment.",
        });
      }
    });
  } catch (err: any) {
    console.error("An error occurred: ", err.message);
    return res.status(501).json(err);
  }
});

// CRUD - Update
app.post("/updatemovie", (req: any, res: any) => {
  try {
    // capitalize the first letter of each word
    const pascal_case_req: Record<string, string | null> = transformValOf(
      req.body,
      toPascalCase,
    ); // in TypeScript, `Record<string, string | null>` is a utility type that represents an object type with keys of type string and values that can either be of type string or null (https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
    const { title, cast, category } = pascal_case_req;

    // in ER Diagram, "Allow NULL" is set to false for `title`. Ensure it's provided in the request body
    // "" and '' (empty string) are falsy values (https://developer.mozilla.org/en-US/docs/Glossary/Truthy)
    if (!title) {
      return res.status(400).json({ error: "Movie title is required." });
    }
    // check if movie already exists
    const query = `
      IF EXISTS (SELECT 1 FROM Movie WHERE title = ?)
      BEGIN
      UPDATE Movie
      SET title = ?, cast = ?, category = ?
      OUTPUT INSERTED.*
      WHERE title COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ?
      END
    `;
    sql.query(
      connectionString,
      query,
      [title, title, cast, category, title],
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
          return res.status(201).json({
            conflict: "Sorry, this movie is not in store at the moment.",
          });
        }
      },
    );
  } catch (err: any) {
    console.error("An error occurred: ", err.message);
    return res.status(501).json({ error: "Internal server error." });
  }
});

// CRUD - Delete
app.get("/deletemovie/:name", (req: any, res: any) => {
  try {
    // type was already validated in Front-End; defined for clarity
    const title: string = req.params.name;

    // in ER Diagram, "Allow NULL" is set to false for `title`. Ensure it's provided in the request body
    // even though the Front-End checks that `name` is not empty, double-check
    // "" and '' (empty string) are falsy values (https://developer.mozilla.org/en-US/docs/Glossary/Truthy)
    if (!title) {
      return res.status(400).json({ error: "Movie title is required." });
    }
    // check if movie already exists
    const query = `
      IF EXISTS (SELECT 1 FROM Movie WHERE title = ?)
      BEGIN
      DELETE FROM Movie
      OUTPUT DELETED.*
      WHERE title COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ?
      END
    `;
    sql.query(
      connectionString,
      query,
      [title, title],
      (err: any, resultset: any) => {
        if (err) {
          /* directly exposing error details from the server, especially those originating from a database,
            can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
            In addition, a generic error message is more user-friendly */
          console.error("SQL query error: ", err.message);
          return res.status(500).json({ error: "Internal server error." });
        }
        if (resultset && resultset.length) {
          console.log("Movie deleted in DB: ", resultset);
          return res
            .status(200)
            .json({ success: "Movie successfully deleted.", movie: resultset });
        } else {
          // in case the movie doesn't exist, the `OUTPUT` doesn't get executed, ie. result set is null
          return res.status(201).json({
            conflict: "Sorry, this movie is not in store at the moment.",
          });
        }
      },
    );
  } catch (err: any) {
    console.error("An error occurred: ", err.message);
    return res.status(501).json({ error: "Internal server error." });
  }
});
