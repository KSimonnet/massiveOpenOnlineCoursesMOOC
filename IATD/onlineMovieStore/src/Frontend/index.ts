import * as inquirer from "inquirer";
import { Account, Movie } from "./classes/ERD";

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
    const res: any = await response.json();

    // Boolean stating whether the response was successful (status in the range 200-299) or not (https://developer.mozilla.org/en-US/docs/Web/API/Response/ok)
    if (!response.ok) {
      console.error(`${res.error}`);
      return { is_authenticated: false, is_admin: false }; // TypeScript is strict and requires uniform return types
    }
    // check if "success" is a property of `res` (not inherited through the prototype chain). `"success" in res` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(res, "success")) {
      // a successful login turns `res` to true, which allows access to `displayMovieOptions()
      console.log(`${res.success}`);
      return { is_authenticated: true, is_admin: res.is_admin };
    } else {
      console.log(`${res.conflict}`);
      return { is_authenticated: false, is_admin: false }; // indicates login failure
    }
  } catch (error: any) {
    console.error("HTTP error: ", error.message); // "Internal server error."
    return { is_authenticated: false, is_admin: false };
  }
}

async function signup() {
  const credentials = await Account.getLoginCred();

  try {
    // Construct the request data - TODO (hard-coded)
    const user_cred: object = {
      user_name: credentials.user_name,
      password_hash: credentials.password_hash,
    };
    const request_data = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user_cred),
    };

    // make an HTTP POST request to the Back-End server
    const response = await fetch("http://localhost:3000/signup", request_data);
    const res: any = await response.json();

    // Provide feedback to the user whether, username already exists
    if (!response.ok) {
      console.error(`${res.error}`);
      return { is_authenticated: false, is_admin: false };
    }
    // check if "success" is a property of `res` (not inherited through the prototype chain). `"success" in res` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(res, "success")) {
      // a successful login turns `res` to true, which allows access to `displayMovieOptions()
      console.log(`${res.success}`);
      return { is_authenticated: true, is_admin: !!res.is_admin };
    } else {
      console.log(`${res.conflict}`);
      return { is_authenticated: false, is_admin: false }; // indicates login failure
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    return { is_authenticated: false, is_admin: false };
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

async function addMovieToWatchlist() {
  const { title } = await Movie.getMovieTitle();
  try {
    const url = `http://localhost:3000/towatchlist/${title}`;
    const response = await fetch(url);
    const watchlist_movie = await response.json();

    // check if "success" is a property of the Object (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(watchlist_movie, "success")) {
      // display what movie has been added
      console.log(`${watchlist_movie.success}`);
    } else {
      // inform user the movie to add already exists
      console.log(`${watchlist_movie.conflict}`);
      return null;
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    return null;
  }
}

// CRUD - Create
async function addMovie() {
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

async function displayMovieOptions(is_admin: boolean) {
  console.log("Welcome to the Online Movie Store!");
  const choices = [
    "Browse all movies",
    "Search a movie",
    "Add a movie to my watchlist",
    "Add a new movie",
    "Update an existing movie",
    "Delete an existing movie",
    "Logout",
  ];

  // remove "Add a new movie", "Update an existing movie", "Delete an existing movie" if user is not an admin
  if (!is_admin) choices.splice(3, 3); // mutates `choices` in-place

  // infinite loop
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices,
      },
    ]);

    switch (action) {
      case "Browse all movies":
        await BrowseMovies();
        break;
      case "Search a movie":
        await searchMovies();
        break;
      case "Add a movie to my watchlist":
        await addMovieToWatchlist();
        break;
      case "Add a new movie":
        if (is_admin) await addMovie();
        else console.log("Unauthorized action.");
        break;
      case "Update an existing movie":
        if (is_admin) await updateMovie();
        else console.log("Unauthorized action.");
        break;
      case "Delete an existing movie":
        if (is_admin) await deleteMovie();
        else console.log("Unauthorized action.");
        break;
      case "Logout":
        console.log("Logout successful!"); // Provide feedback to the user
        return; // Exit the function, effectively ending the movie options
    }
  }
}

async function main() {
  let is_authenticated: boolean = false;
  let is_admin: boolean = false;

  // Infinite loop
  while (true) {
    //
    if (!is_authenticated) {
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
        ({ is_authenticated, is_admin } = await login());
      } else if (loginOrSignup.choice === "Signup") {
        ({ is_authenticated, is_admin } = await signup());
      } else if (loginOrSignup.choice === "Exit") {
        console.log("Goodbye!");
        process.exit(0);
      }
    } else {
      // User is logged in, display movie-related options
      await displayMovieOptions(is_admin); //

      // After logging out from movie options, reset the user variable
      is_authenticated = false;
    }
  }
}

main();
