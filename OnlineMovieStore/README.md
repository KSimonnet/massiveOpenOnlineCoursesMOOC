# Pre-requisites

1. Install SQL Server 2020 and SQL Server Management Studio (SSMS)

2. Upon opening SSMS, the login interface will pop-up. Copy what's in the field "Server name". This's the name of your database server

3. Open the file located at: `src/BackEnd-Apis/index.ts`

4. In the line:

```
const connectionString =
  "server=SERVERNAME;Database=OnlineMovieStore;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
```

replace `SERVERNAME` by pasting what you've just copied

5. In the SSMS login interface, select "Connect"

6. Select `Databases`, right-click and select `New Database..`

7. In the `Database name` field, input `OnlineMovieStore` and click `OK`

8. Expand the newly created `OnlineMovieStore` folder and select `Tables > New > Tables`

9. Create 4 tables as described in the file `onlineMovieStore-assignment.drawio.svg` along with their respective relationships

10. In the ribbon, select `New Query`. This will open a blank page 11. Paste in the following queries:

```
USE OnlineMovieStore
INSERT INTO Account (user_name, password_hash, is_admin)
VALUES
('Admin', 'pwd', '1')
('user', 'pwd', 'NULL');
INSERT INTO Movie (title, cast, category)
VALUES
('Lord of the rings', 'JRR Tolkien', 'Adventure'),
('Star Wars', 'Luke Skywalker', 'Ruined Franchise'),
('Indiana Jones', 'Harrison Ford', 'Adventure'),
('Lethal Weapon', 'Mel Gibson', 'Action');
```
then select `Execute`

This will insert records in the database.

## Initialise your EDI

1. In your preferred EDI (Integrated Development Environment), open the root directory `src` of the project

2. Open two split Terminals aka CLI (Command Line Interface)

 - In one, navigate to: `src/Frontend` by running the following command:
   `$ cd ./frontend`

 - In the other one, navigate to: `src/BackEnd-Apis` by running the following command:
   `$ cd ./backend-apis`

### Install dependencies

1. In both the Terminals (`src/Frontend`, `src/BackEnd-Apis`) run the following command:
   `$ npm install`

#### Run the application

A TypeScript file `index.ts` is located each Frontend and BackEnd-Apis folders (`src/Frontend`, `src/BackEnd-Apis`).

1. In both the Terminals (`src/Frontend`, `src/BackEnd-Apis`), run the following command:
   `$ npm run start`.
   The Terminal for `src/Frontend` should output to the console: "Please log in or sign up:"
   The Terminal for `src/BackEnd-Apis` should output to the console: "BE server running"
2. In the Terminal for `src/Frontend` a CLI should display the following options:
   "

- Login
- Signup
- Exit
  "
  Select `Login` and press "Enter"

3. To the CLI prompts `Enter your username:` and `Enter your password:` try the two types of users: Admin and regular user by entering the credentials of each users you've created at step "Pre-requisites" ie. "Admin", "pwd" OR "user", "pwd"
