export default class MovieModel {
  private db: any;

  constructor(dbConnection: any) {
    this.db = dbConnection;
  }

  create(
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

  read(title: string, callback: Function): void {
    const query = "SELECT title, cast, category FROM Movie WHERE title = ?";
    this.db.query(query, [title], callback);
  }

  // Add update and delete methods similarly
}
