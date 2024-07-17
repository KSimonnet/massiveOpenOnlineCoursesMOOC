import * as inquirer from "inquirer";
import { Account, Movie } from "./classes/ERD";

// // `MovieRequest` is a custom type for the request that leverages TypeScript to enforce the types at compile time,
// // rather than running runtime checks.
// // The Request interface is located within the directory: `@types/express` > `index.d.ts`
// interface MovieRequest extends Request {
//   params: {
//     name: string;
//   };
// }

async function login() {
  // runtime parameters check
  const credentials = await Account.getLoginCred();

  try {
    const url = "http://localhost:3000/login";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const is_authenticated: any = await response.json();
    // Boolean stating whether the response was successful (status in the range 200-299) or not (https://developer.mozilla.org/en-US/docs/Web/API/Response/ok)
    if (!response.ok) {
      console.error(`${is_authenticated.error}`);
    }
    // check if "success" is a property of `is_authenticated` (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(is_authenticated, "success")) {
      // a successful login turns `is_authenticated` to true, which allows access to `displayMovieOptions()
      console.log(`${is_authenticated.success}`);
      return true;
    } else {
      console.log(`${is_authenticated.conflict}`);
      return null; // indicates login failure
    }
  } catch (error: any) {
    console.error("HTTP error: ", error.message); // "Internal server error."
    return null;
  }
}

async function signup() {
  const credentials = await Account.getLoginCred();

  try {
    // Construct the request data - TODO (hard-coded)
    const user: object = {
      user_name: credentials.user_name,
      password_hash: credentials.password_hash,
    };
    const request_data = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    };

    // make an HTTP POST request to the Back-End server
    const response = await fetch("http://localhost:3000/signup", request_data);

    // Provide feedback to the user as to:
    // - Invalid username or password
    // - OR, username already exists
    const is_authenticated: any = await response.json();
    if (!response.ok) {
      console.error(`${is_authenticated.error}`);
    }
    // check if "success" is a property of `is_authenticated` (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(is_authenticated, "success")) {
      return true; // successful login turns `is_authenticated` to true, which allows access to `displayMovieOptions()
    } else {
      return null; // indicates login failure
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    return null;
  }
}

async function BrowseMovies() {
  try {
    const response = await fetch("http://localhost:3000/movies");
    const movies = await response.json();
    /* The Response object inherits from `Response.prototype` provided by the Fetch API, which defines the `ok` getter.
    This getter function checks the status property of the `Response` object and
    returns `true` if the status is in the range 200–299, indicating a successful response */
    if (!response.ok) {
      console.error(`${movies.error}`);
    }
    // check if "success" is a property of `movies` (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(movies, "success")) {
      // display list of available movies
      console.log(`${movies.success}`);
      Movie.displayMovieList(movies.list);
    } else {
      // inform user no movie is in store
      console.log(`${movies.conflict}`);
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
  }
}

// CRUD - Create
async function addMovie() {
  // TODO - serialise by creating a generic function
  const movie_details = await Movie.getMovieDetails();

  try {
    // Construct the request data - TODO (hard-coded)
    const movie = {
      title: movie_details.title,
      cast: movie_details.cast,
      category: movie_details.category,
    };
    const request_data = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movie),
    };

    // make an HTTP POST request to the Back-End server
    const response = await fetch(
      "http://localhost:3000/addmovie",
      request_data,
    );
    const added_movie = await response.json();

    // check if "success" is a property of the Object (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(added_movie, "success")) {
      // display what movie has been added
      console.log(`${added_movie.success}`);
      Movie.displayMovieList(added_movie.movie);
    } else {
      // inform user the movie to add already exists
      console.log(`${added_movie.conflict}`);
      return null;
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    return null;
  }
}

// CRUD - Read
async function searchMovies() {
  const { title } = await Movie.getMovieTitle();
  try {
    const url = `http://localhost:3000/readmovie/${title}`;
    const response = await fetch(url);
    const movie = await response.json();

    if (!response.ok) {
      console.error(`${movie.error}`);
    }
    // check if "success" is a property of `movie` (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(movie, "success")) {
      // display movie requested by user
      console.log(`${movie.success}`);
      Movie.displayMovieList(movie.movie);
    } else {
      // inform user the movie requested isn't in store
      console.log(`${movie.conflict}`);
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
  }
}

// CRUD - Update
async function updateMovie() {
  const movie_details = await Movie.getMovieDetails();

  try {
    // Construct the request data
    const movie = {
      title: movie_details.title,
      cast: movie_details.cast,
      category: movie_details.category,
    };
    const request_data = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movie),
    };

    // make an HTTP POST request to the Back-End server
    const response = await fetch(
      "http://localhost:3000/updatemovie",
      request_data,
    );
    const updated_movie = await response.json();

    // check if "success" is a property of the Object (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(updated_movie, "success")) {
      // display the updated movie
      console.log(`${updated_movie.success}`);
      Movie.displayMovieList(updated_movie.movie);
    } else {
      // inform user the movie to update isn't in store
      console.log(`${updated_movie.conflict}`);
      return null;
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    return null;
  }
}

// CRUD - Delete
async function deleteMovie() {
  const { title } = await Movie.getMovieTitle();
  try {
    const url = `http://localhost:3000/deletemovie/${title}`;
    const response = await fetch(url);
    const deleted_movie = await response.json();
    if (!response.ok) {
      console.error(`${deleted_movie.error}`);
    }
    // check if "success" is a property of `deleted_movie` (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(deleted_movie, "success")) {
      // confirm deletion of the movie to the user
      console.log(`${deleted_movie.success}`);
      Movie.displayMovieList(deleted_movie.movie);
    } else {
      // inform user the movie to delete isn't in store
      console.log(`${deleted_movie.conflict}`);
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
  }
}

async function displayMovieOptions() {
  console.log("Welcome to the Online Movie Store!");

  // Infinite loop
  while (true) {
    const choices = [
      "Browse Movies",
      "Search Movies",
      "Add a new movie",
      "Update an existing movie",
      "Delete an existing movie",
      "Logout",
    ];

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices,
      },
    ]);

    switch (action) {
      case "Browse Movies":
        await BrowseMovies();
        break;
      case "Search Movies":
        await searchMovies();
        break;
      case "Add a new movie":
        await addMovie();
        break;
      case "Update an existing movie":
        await updateMovie();
        break;
      case "Delete an existing movie":
        await deleteMovie();
        break;
      case "Logout":
        console.log("Logout successful!"); // Provide feedback to the user
        return; // Exit the function, effectively ending the movie options
    }
  }
}

async function main() {
  let user = null;

  // Infinite loop
  while (true) {
    if (!user) {
      console.log("Please log in or sign up:");
      const loginOrSignup = await inquirer.prompt([
        {
          type: "list",
          name: "choice",
          message: "Choose an option:",
          choices: ["Login", "Signup", "Exit"],
        },
      ]);

      if (loginOrSignup.choice === "Login") {
        user = await login();
      } else if (loginOrSignup.choice === "Signup") {
        user = await signup();
      } else if (loginOrSignup.choice === "Exit") {
        console.log("Goodbye!");
        process.exit(0);
      }
    } else {
      // User is logged in, display movie-related options
      await displayMovieOptions();

      // After logging out from movie options, reset the user variable
      user = null;
    }
  }
}

main();
