const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sql = require("msnodesqlv8");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const connectionString =
  "server=SERVERNAME;Database=OnlineMovieStore;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}"; //ADD YOUR CONNECTION STRING HERE

app.post("/login", (req: any, res: any) => {
  try {
    const { user_name, password_hash } = req.body;

    // Ensure that both username and password_hash are provided in the request body
    if (!user_name || !password_hash) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    // Create a query to validate user credentials and return response
    var check_query = `SELECT user_name, password_hash FROM Account WHERE user_name = ? AND password_hash = ?`;
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
        if (rows.length > 0) {
          console.log("Credentials validated: ", rows);
          return res.status(200).json({ success: "User authenticated." });
        } else {
          return res
            .status(401)
            .json({ error: "Invalid credentials. Please try again." });
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

    // Ensure that both username and password_hash are provided in the request body
    if (!user_name || !password_hash) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    // check if user_name already exists
    var check_query = `SELECT user_name FROM Account WHERE user_name = ?`;
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
        if (rows.length > 0) {
          // if user exists, return notification
          console.log("Existing account: ", rows);
          return res
            .status(409)
            .json({ error: "This username is already taken." });
        } else {
          // insert new user
          var insert_query = `
            INSERT INTO Account (user_name, password_hash)
            OUTPUT INSERTED.user_name, INSERTED.password_hash
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
                  .status(500)
                  .json({ error: "Internal server error." });
              }
              if (resultset && resultset.length > 0) {
                console.log("Added account: ", resultset);
                return res
                  .status(201)
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
    var list_query = "SELECT title, cast, category FROM  Movie";
    // sends to the Front-End a list of all the movies in store
    sql.query(connectionString, list_query, (err: any, rows: any) => {
      if (err) {
        // directly exposing error details from the server, especially those originating from a database,
        // can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
        // In addition, a generic error message is more user-friendly
        console.error("SQL query error: ", err.message);
        return res.status(500).json({ error: "Internal server error." });
      }
      if (rows.length > 0) {
        console.log("Credentials validated: ", rows);
        return res.status(200).json({ success: "Movies found." });
      } else {
        return res
          .status(401)
          .json({ error: "Sorry, we've no movies available at the moment." });
      }
    });
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/movie/:name", async (req: any, res: any) => {
  try {
    // type was already validated in Front-End; defined for clarity
    const movie_name: string = req.params.name;

    if (movie_name.length) {
      // `movie_name` passed as a parameter to the query function,
      // rather than directly by using `${movie_name}` to prevent SQL injection
      const movie_query =
        "SELECT title, cast, category FROM Movie WHERE title COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ?"; // CI_AS (Case Insensitive, Accent Sensitive). A collation is a set of rules for comparing characters in a string.
      sql.query(
        connectionString,
        movie_query,
        [movie_name],
        (err: any, rows: any) => {
          if (err) {
            // directly exposing error details from the server, especially those originating from a database,
            // can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
            // In addition, a generic error message is more user-friendly
            console.error("SQL query error: ", err.message);
            return res.status(500).json({ error: "Internal server error." });
          }
          if (rows.length > 0) {
            console.log("Movie found: ", rows);
            return res
              .status(200)
              .json({ success: "We've found your requested movie: " });
          } else {
            return res.status(401).json({
              error: "Sorry, this movie is not in store at the moment.",
            });
          }
        },
      );
    }
  } catch (err: any) {
    console.error("An error occurred: ", err.message);
    return res.status(500).json(err);
  }
});

// CRUD
app.post("/movie", async (req: any, res: any) => {
  try {
    const { name } = req.body;
    var query = `INSERT INTO Movie (name) VALUES (?)`;

    sql.query(connectionString, query, [name], (err: any, rows: any) => {
      if (err) {
        // directly exposing error details from the server, especially those originating from a database,
        // can provide attackers with insights into the backend structure, database schema, or even potential vulnerabilities.
        // In addition, a generic error message is more user-friendly
        console.error("SQL query error: ", err.message);
        return res.status(500).json({ error: "Internal server error." });
      }
      if (rows.length > 0) {
        console.log("Movie found: ", rows);
        return res
          .status(200)
          .json({ success: "We've found your requested movie: " });
      } else {
        return res
          .status(401)
          .json({ error: "Sorry, this movie is not in store at the moment." });
      }
    });
  } catch (err: any) {
    console.error("An error occurred: ", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// add movies to watchlist
// role-based access control, allowing different levels of access for regular users and administrators. Can login as an Admin or User. Administrators (and Users) should be able to add, update, delete, and view movie data.
// use of TypeScript classes and interfaces to define entities and relationships

app.listen(3000, () => {
  console.log("BE server running");
});
