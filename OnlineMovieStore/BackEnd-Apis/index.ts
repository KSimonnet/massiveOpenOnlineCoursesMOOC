import * as express from "express";
const app = express();
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as sql from "msnodesqlv8";

import { transformValOf } from "./modules/transform-values-of";
import { toPascalCase } from "../utils/manip-str/index";
import { Account, Watchlist } from "../Frontend/classes/ERD";

app.use(cors());
app.use(bodyParser.json());

const connectionString =
  "server=SERVERNAME;Database=OnlineMovieStore;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
let curr_account: Account;
let curr_watchlist: Watchlist;

app.post("/login", (req: any, res: any) => {
  try {
    const { user_name, password_hash } = req.body;

    // in ER Diagram, "Allow NULL" is set to false for both, `user_name` and `password_hash`. Ensure they're provided in the request body
    if (!user_name || !password_hash) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }
    // validate user credentials
    const check_query = `SELECT 1 FROM Account WHERE user_name = ? AND password_hash = ?`;
    sql.query(
      connectionString,
      check_query,
      [user_name, password_hash],
      (err: any, check_rows: any) => {
        if (err) {
          /* directly exposing error details from the server, especially those originating from a database,
          can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
          In addition, a generic error message is more user-friendly */
          console.error("SQL query error: ", err.message);
          return res.status(500).json({ error: "Internal server error." });
        }
        if (check_rows && check_rows.length) {
          // Account authenticated
          console.log("Credentials validated");

          // instantiate a new `Account` and `Watchlist` for the current session
          const check_query = `SELECT * FROM Account WHERE user_name = ? AND password_hash = ?`; // https://learn.microsoft.com/en-us/sql/odbc/reference/develop-app/statement-parameters?view=sql-server-ver16
          // the callback function of sql.query, whislt not async, is executed asynchronously
          // `try...catch` block only catches exceptions thrown synchronously within the `try` block
          // hence, exceptions should be directly handled inside the callback, rather being thrown
          sql.query(
            connectionString,
            check_query,
            [user_name, password_hash],
            (err: any, user_rows: any) => {
              if (err) {
                console.error("SQL query error: ", err.message);
                return res
                  .status(500)
                  .json({ error: "Internal server error." });
              }
              if (user_rows && user_rows.length) {
                console.log("Current user authenticated: ", user_rows);
                const user_id = user_rows[0].user_id;
                /* Because of the One-to-One relationship between `Account` and `Watchlist`,
                it was required to store an instance of `Watchlist`.
                To be instantiated `Account` takes all key-value pairs in `user_rows` as parameters + `Watchlist` instance.
                Hence, `Watchlist` needs to be instantiated before `Account`. */
                /* `INSERT`is not idempotent ie. each execution of the statement will create a new record in the `Watchlist` table
                with a newly auto-incremented `watchlist_id`. Hence the conditional check if a `Watchlist` already exists for the current `user_id`. */
                /* `SELECT 1` does not retrieve any actual data from the column(s) of the table;
                it simply returns the number `1` for each row that meets the condition.
                The database engine stops scanning as soon as it finds the first matching row. */
                /* Placeholders `?` are positional ie. for `NOT EXISTS`, the first `?` taps into the first element in the array of the parametrised query.
                In index order, the next elements are used for `INSERT INTO`; and so forth.
                Since `user_id` is passed onto all queries, it needs to be repeated. */
                const watchlist_query = `
                  IF NOT EXISTS (SELECT 1 FROM Watchlist WHERE user_id = ?)
                  BEGIN
                      INSERT INTO Watchlist (user_id) VALUES (?);
                      SELECT SCOPE_IDENTITY() AS LastInsertedId;
                  END
                  ELSE
                  BEGIN
                      SELECT watchlist_id AS LastInsertedId FROM Watchlist WHERE user_id = ?;
                  END
                  `; // `SCOPE_IDENTITY()` returns the last identity value generated for any table in the current session and the current scope (https://learn.microsoft.com/en-us/sql/t-sql/functions/scope-identity-transact-sql?view=sql-server-ver16)
                sql.query(
                  connectionString,
                  watchlist_query,
                  [user_id, user_id, user_id],
                  (err: any, wl_rows: any) => {
                    if (err) {
                      console.error("SQL query error: ", err.message);
                      return res
                        .status(500)
                        .json({ error: "Internal server error." });
                    }
                    if (wl_rows && wl_rows.length) {
                      // instanciate a new `Watchlist` associated with this account
                      console.log(
                        "ID of the Watchlist created last: ",
                        wl_rows,
                      );
                      curr_watchlist = new Watchlist(
                        wl_rows[0].LastInsertedId,
                        user_id,
                      );

                      // instanciate a new `Account` as a Session Storage Mechanism
                      curr_account = new Account(
                        user_id,
                        user_rows[0].user_name,
                        user_rows[0].password_hash,
                        user_rows[0].is_admin,
                        curr_watchlist,
                      );
                    }
                  },
                );

                // return role access level to the Front-End
                return res.status(200).json({
                  success: "User authenticated.",
                  is_admin: user_rows[0].is_admin,
                }); /* even though the data type in DB is Bit, it is returned as a Boolean.
                    No need for converting Bit to Boolean. in `!!user_rows[0].is_admin` the first `!` negates the value,
                    turning thruty value `1` into false and falsy ones (`0` or `null`) into true. The second `!` reverts the original to Boolean. */
              } else {
                return res
                  .status(201)
                  .json({ conflict: "Invalid credentials. Please try again." });
              }
            },
          );
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

    // check if `user_name` already exists
    const check_query = `SELECT 1 FROM Account WHERE user_name = ?`;
    sql.query(
      connectionString,
      check_query,
      [user_name],
      (err: any, check_rows: any) => {
        if (err) {
          // directly exposing error details from the server, especially those originating from a database,
          // can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
          // In addition, a generic error message is more user-friendly
          console.error("SQL query error: ", err.message);
          return res.status(500).json({ error: "Internal server error." });
        }
        // check if user already exists
        if (check_rows && check_rows.length) {
          console.log("Existing account: ", check_rows);
          return res.status(401).json({
            conflict:
              "This username is already taken. Please try again with a different one",
          });
        } else {
          // TODO - instantiate a new `Account` and `Watchlist` for the current session
          const check_query = `INSERT INTO Account (user_name, password_hash) OUTPUT INSERTED.* VALUES (?,?)`;
          // the callback function of sql.query, whislt not async, is executed asynchronously
          // `try...catch` block only catches exceptions thrown synchronously within the `try` block
          // hence, exceptions should be directly handled inside the callback, rather being thrown
          sql.query(
            connectionString,
            check_query,
            [user_name, password_hash],
            (err: any, resultset: any) => {
              if (err) {
                console.error("SQL query error: ", err.message);
                return res
                  .status(500)
                  .json({ error: "Internal server error." });
              }
              if (resultset && resultset.length) {
                const user_id = resultset[0].user_id;
                /* Because of the One-to-One relationship between `Account` and `Watchlist`,
                it was required to store an instance of `Watchlist`.
                To be instantiated `Account` takes all key-value pairs in `resultset` as parameters + `Watchlist` instance.
                Hence, `Watchlist` needs to be instantiated before `Account`. */
                /* `INSERT`is not idempotent ie. each execution of the statement will create a new record in the `Watchlist` table
                with a newly auto-incremented `watchlist_id`. Hence the conditional check if a `Watchlist` already exists for the current `user_id`. */
                /* `SELECT 1` does not retrieve any actual data from the column(s) of the table;
                it simply returns the number `1` for each row that meets the condition.
                The database engine stops scanning as soon as it finds the first matching row. */
                /* Placeholders `?` are positional ie. for `NOT EXISTS`, the first `?` taps into the first element in the array of the parametrised query.
                In index order, the next elements are used for `INSERT INTO`; and so forth.
                Since `user_id` is passed onto all queries, it needs to be repeated. */
                const watchlist_query = `
                  IF NOT EXISTS (SELECT 1 FROM Watchlist WHERE user_id = ?)
                  BEGIN
                      INSERT INTO Watchlist (user_id) VALUES (?);
                      SELECT SCOPE_IDENTITY() AS LastInsertedId;
                  END
                  ELSE
                  BEGIN
                      SELECT watchlist_id AS LastInsertedId FROM Watchlist WHERE user_id = ?;
                  END
                  `; // `SCOPE_IDENTITY()` returns the last identity value generated for any table in the current session and the current scope (https://learn.microsoft.com/en-us/sql/t-sql/functions/scope-identity-transact-sql?view=sql-server-ver16)
                sql.query(
                  connectionString,
                  watchlist_query,
                  [user_id, user_id, user_id],
                  (err: any, wl_rows: any) => {
                    if (err) {
                      console.error("SQL query error: ", err.message);
                      return res
                        .status(500)
                        .json({ error: "Internal server error." });
                    }
                    if (wl_rows && wl_rows.length) {
                      // instanciate a new `Watchlist` associated with this account
                      console.log(
                        "ID of the Watchlist created last: ",
                        wl_rows,
                      );
                      curr_watchlist = new Watchlist(
                        wl_rows[0].LastInsertedId,
                        user_id,
                      );

                      // instanciate a new `Account` as a Session Storage Mechanism
                      curr_account = new Account(
                        user_id,
                        resultset[0].user_name,
                        resultset[0].password_hash,
                        resultset[0].is_admin,
                        curr_watchlist,
                      );
                    }
                  },
                );

                // return role access level to the Front-End
                return res.status(200).json({
                  success: "User authenticated.",
                  is_admin: resultset[0].is_admin,
                }); /* even though the data type in DB is Bit, it is returned as a Boolean.
                    No need for converting Bit to Boolean. in `!!resultset[0].is_admin` the first `!` negates the value,
                    turning thruty value `1` into false and falsy ones (`0` or `null`) into true. The second `!` reverts the original to Boolean. */
              } else {
                return res
                  .status(201)
                  .json({ conflict: "Invalid credentials. Please try again." });
              }
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

// browse movie collection
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

// add a movie to watchlist
app.get("/towatchlist/:name", (req: any, res: any) => {
  try {
    // type was already validated in Front-End; defined for clarity
    const title: string = req.params.name;
    // even though the Front-End checks that `name` is not empty, doube-check
    if (!title) {
      return res.status(400).json({ error: "Movie title is required." });
    }
    const movie_id_query =
      "SELECT movie_id FROM Movie WHERE title COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ?"; // CI_AS (Case Insensitive, Accent Sensitive). A collation is a set of rules for comparing characters in a string.
    sql.query(
      connectionString,
      movie_id_query,
      [title],
      (err: any, id_rows: any) => {
        if (err) {
          console.error("SQL query error: ", err.message);
          return res.status(500).json({ error: "Internal server error." });
        }
        if (id_rows && id_rows.length) {
          // Movie requested by the user was found
          const movie_id: number = id_rows[0].movie_id;
          console.log("Movie ID: ", movie_id);
          const watchlist_id: number =
            curr_account.getPublicData().watchlist_id; // curr_watchlist.watchlist_id;
          if (watchlist_id && movie_id) {
            // only add to watchlist if the movie isn't listed already
            const query = `
            IF NOT EXISTS (SELECT 1 FROM Watchlist_Item WHERE movie_id = ?)
            BEGIN
              INSERT INTO Watchlist_Item (watchlist_id, movie_id)
              OUTPUT INSERTED.*
              VALUES (?, ?);
            END`;
            sql.query(
              connectionString,
              query,
              [movie_id, watchlist_id, movie_id],
              (err: any, rows: any) => {
                if (err) {
                  console.error("SQL query error: ", err.message);
                  return res
                    .status(500)
                    .json({ error: "Internal server error." });
                }
                console.log("Confirmed added to watchlist: ", rows);
                if (rows && rows.length) {
                  console.log("Movie added to watchlist");
                  return res.status(200).json({
                    success: "Movie successfully added to watchlist.",
                  });
                } else {
                  // in case the movie doesn't exist, the `OUTPUT` doesn't get executed, ie. rows set is `[]`
                  return res.status(201).json({
                    conflict: "This movie is already on your watchlist.",
                  });
                }
              },
            );
          }
        }
      },
    );
  } catch (err: any) {
    console.error("An error occurred: ", err.message);
    return res.status(501).json({ error: "Internal server error." });
  }
});

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
Placeholders `?` are positional ie. for `NOT EXISTS`, the first `?` taps into the first element in the array of the parametrised query.
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
          // in case the movie already exists, the `INSERT INTO` + `OUTPUT` don't get executed, ie. result set is `[]`
          return res.status(201).json({
            conflict:
              "This movie already exists. Please try a different title.",
          }); // result set is the collection of rows returned by `OUTPUT`. https://learn.microsoft.com/en-us/sql/t-sql/statements/insert-transact-sql?view=sql-server-ver16#t-using-output-with-an-insert-statement
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
          // in case the movie doesn't exist, the `OUTPUT` doesn't get executed, ie. result set is `[]`
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
          // in case the movie doesn't exist, the `OUTPUT` doesn't get executed, ie. result set is `[]`
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

app.listen(3000, () => {
  console.log("BE server running");
});
