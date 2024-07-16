const inquirer = require("inquirer");

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
  const credentials = await inquirer.prompt([
    {
      type: "input",
      name: "user_name",
      message: "Enter your username:",
      // in ER Diagram, "Allow NULL" is set to false for `user_name` and `password_hash`
      required: true,
      // Inquirer.js coerces input as a string, since command line input is inherently string-based
      validate: function (user_input: string) {
        // keep prompting user until a valid username is provided
        if (!user_input) {
          return "Username cannot be empty.";
        }
        return true;
      },
    },
    {
      type: "password",
      name: "password_hash",
      message: "Enter your password:",
      required: true,
      validate: function (user_input: string) {
        if (!user_input) {
          return "Password cannot be empty.";
        }
        return true;
      },
    },
  ]);

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
    console.error("HTTP error: ", error.message); // "Internal server error."
    return null;
  }
}

async function signup() {
  const credentials = await inquirer.prompt([
    {
      type: "input",
      name: "user_name",
      message: "Enter your username: ",
      // in ER Diagram, "Allow NULL" is set to false for `user_name` and `password_hash`
      required: true,
      // Inquirer.js coerces input as a string, since command line input is inherently string-based
      validate: function (user_input: string) {
        // keep prompting user until a valid username is provided
        if (!user_input) {
          return "Username cannot be empty.";
        }
        return true;
      },
    },
    {
      type: "password",
      name: "password_hash",
      message: "Enter your password:",
      required: true,
      validate: function (user_input: string) {
        // keep prompting user until a valid username is provided
        if (!user_input) {
          return "Password cannot be empty.";
        }
        return true;
      },
    },
  ]);

  try {
    // Construct the request data
    const user = {
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
      console.log(`${movies.success}: ${movies.list}`);
    } else {
      // inform user no movie is ain store
      console.log(movies.conflict);
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
  }
}
async function searchMovies() {
  const requested_movie = await inquirer.prompt([
    {
      type: "input",
      name: "movie_name",
      message: "Enter the name of the movie you want to search for: ",
      required: true,
      validate: function (user_input: string) {
        // keep prompting user until a valid username is provided
        if (!user_input) {
          return "The movie name cannot be empty.";
        }
        return true;
      },
    },
  ]);
  const movie_name = requested_movie.movie_name;
  try {
    const url = `http://localhost:3000/movie/${movie_name}`;

    //ADD YOUR CODE HERE
    const response = await fetch(url);
    const movie = await response.json();

    if (!response.ok) {
      console.error(`${movie.error}`);
    }
    // check if "success" is a property of `movie` (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(movie, "success")) {
      // movie requested by user is available
      console.log(`${movie.success}: ${movie.movie}`);
    } else {
      console.log(movie.conflict);
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
  }
}

// CRUD
async function addMovie() {
  const credentials = await inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "Enter the name of the movie you'd like to add: ",
      required: true,
      validate: function (user_input: string) {
        // keep prompting user until a valid username is provided
        if (!user_input) {
          return "Movie title cannot be empty.";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "cast",
      message: "Enter the name of the main actor/actress: ",
    },
    {
      type: "input",
      name: "category",
      message: "Enter the category the movie belongs to: ",
    },
  ]);

  try {
    // Construct the request data
    const movie = {
      title: credentials.title,
      cast: credentials.cast,
      category: credentials.category,
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
    const res = await response.json();

    // check if "success" is a property of the Object (not inherited through the prototype chain). `"success" in is_authenticated` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
    if (Object.prototype.hasOwnProperty.call(res, "success")) {
      //
      console.log("test - success");
      console.log(`${res.success}`);
      return response;
    } else {
      //
      console.log("res: ", res);
      console.log(`${res.conflict}`);
      return null; // indicates login failure
    }
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    return null;
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
