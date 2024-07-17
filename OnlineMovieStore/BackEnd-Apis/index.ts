import * as express from "express";
const app = express();
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as sql from "msnodesqlv8";

import { transformValOf } from "./modules/transform-values-of";
import { toPascalCase } from "./utils/manip-str/index";

app.use(cors());
app.use(bodyParser.json());

const connectionString =
  "server=ADMINLenovo;Database=OnlineMovieStore;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}"; // SERVERNAME

app.post("/login", (req: any, res: any) => {
  try {
    const { user_name, password_hash } = req.body;

    // in ER Diagram, "Allow NULL" is set to false for both, `user_name` and `password_hash`. Ensure they're provided in the request body
    if (!user_name || !password_hash) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    // Create a query to validate user credentials and return response
    const check_query = `SELECT user_name, password_hash FROM Account WHERE user_name = ? AND password_hash = ?`; // https://learn.microsoft.com/en-us/sql/odbc/reference/develop-app/statement-parameters?view=sql-server-ver16
    // the callback function of sql.query, whislt not async, is executed asynchronously
    // `try...catch` block only catches exceptions thrown synchronously within the `try` block
    // hence, exceptions should be directly handled inside the callback, rather being thrown
    sql.query(
      connectionString,
      check_query,
      [user_name, password_hash],
      (err: any, rows: any) => {
        if (err) {
          // directly exposing error details from the server, especially those originating from a database,
          // can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
          // In addition, a generic error message is more user-friendly
          console.error("SQL query error: ", err.message);
          return res.status(500).json({ error: "Internal server error." });
        }
        // handle case where `rows` is undefined or null
        if (rows && rows.length) {
          console.log("Credentials validated: ", rows);
          return res.status(200).json({ success: "User authenticated." });
        } else {
          return res
            .status(201)
            .json({ conflict: "Invalid credentials. Please try again." });
        }
      },
    );
  } catch (err: any) {
    console.error("HTTP error: ", err.message);
    return res.status(501).json({ error: "Internal server error." });
  }
});

//signup API endpoint
app.post("/signup", (req: any, res: any) => {
  try {
    const { user_name, password_hash } = req.body;

    // in ER Diagram, "Allow NULL" is set to false for both, `user_name` and `password_hash`. Ensure they're provided in the request body
    if (!user_name || !password_hash) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    // check if user_name already exists
    const check_query = `SELECT user_name FROM Account WHERE user_name = ?`;
    sql.query(
      connectionString,
      check_query,
      [user_name],
      (err: any, rows: any) => {
        if (err) {
          // directly exposing error details from the server, especially those originating from a database,
          // can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
          // In addition, a generic error message is more user-friendly
          console.error("SQL query error: ", err.message);
          return res.status(500).json({ error: "Internal server error." });
        }
        if (rows && rows.length) {
          // if user exists, return notification
          console.log("Existing account: ", rows);
          return res
            .status(401)
            .json({ conflict: "This username is already taken." });
        } else {
          // insert new user
          const insert_query = `
            INSERT INTO Account (user_name, password_hash)
            OUTPUT INSERTED.*
            VALUES (?, ?);
          `; // OUTPUT clause captures inserted attributes to be displayed in the front-end
          sql.query(
            connectionString,
            insert_query,
            [user_name, password_hash],
            (err: any, resultset: any) => {
              if (err) {
                console.error("SQL query error: ", err.message);
                return res
                  .status(501)
                  .json({ error: "Internal server error." });
              }
              if (resultset && resultset.length) {
                console.log("Added account: ", resultset);
                return res
                  .status(200)
                  .json({ success: "User created successfully." });
              } // result set is the collection of rows returned by `OUTPUT`. https://learn.microsoft.com/en-us/sql/t-sql/statements/insert-transact-sql?view=sql-server-ver16#t-using-output-with-an-insert-statement
            },
          );
        }
      },
    );
  } catch (err: any) {
    console.error("An error occurred: ", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/movies", ({ req, res }: any) => {
  try {
    const list_query = "SELECT title, cast, category FROM  Movie";
    // sends to the Front-End a list of all the movies in store
    sql.query(connectionString, list_query, (err: any, rows: any) => {
      if (err) {
        // directly exposing error details from the server, especially those originating from a database,
        // can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
        // In addition, a generic error message is more user-friendly
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
});

// CRUD - Create
app.post("/addmovie", async (req: any, res: any) => {
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

// CRUD - Review
app.get("/movie/:name", async (req: any, res: any) => {
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
app.post("/updatemovie", async (req: any, res: any) => {
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
app.post("/deletemovie/:name", async (req: any, res: any) => {
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

// error handling
// add movies to watchlist
// role-based access control, allowing different levels of access for regular users and administrators. Can login as an Admin or User. Administrators (and Users) should be able to add, update, delete, and view movie data.
// use of TypeScript classes and interfaces to define entities and relationships

app.listen(3000, () => {
  console.log("BE server running");
});
