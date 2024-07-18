export default class MovieModel {
  private db: any; // Connection type based on msnodesqlv8

  constructor(dbConnection: any) {
    this.db = dbConnection;
  }

  // browse all movies
  listAllMovies(callback: Function): void {
    const query = "SELECT title, cast, category FROM Movie";
    this.db.query(query, callback);
  }

  // CRUD - Create
  addMovie(
    movie: { title: string; cast: string; category: string },
    callback: Function,
  ): void {
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

    this.db.query(
      query,
      [movie.title, movie.title, movie.cast, movie.category],
      callback,
    );
  }

  // CRUD - Read
  read(title: string, callback: Function): void {
    const query = "SELECT title, cast, category FROM Movie WHERE title = ?";
    this.db.query(query, [title], callback);
  }

  // CRUD - Update
  update(
    movie: { title: string; cast: string; category: string },
    callback: Function,
  ): void {
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
    this.db.query(
      query,
      [movie.title, movie.title, movie.cast, movie.category, movie.title],
      callback,
    );
  }

  // CRUD - Delete
  deleteByTitle(title: string, callback: Function): void {
    const query = `
      IF EXISTS (SELECT 1 FROM Movie WHERE title = ?)
      BEGIN
        DELETE FROM Movie
        OUTPUT DELETED.*
        WHERE title COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ?
      END
    `;
    this.db.query(query, [title, title], callback);
  }
}
