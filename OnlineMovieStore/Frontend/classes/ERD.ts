import * as inquirer from "inquirer";
import { toPascalCase } from "../../utils/manip-str/index";

export class Account {
  private user_id: number;
  public user_name: string;
  private password_hash: string;
  private is_admin: boolean = false;
  private watchlist: Watchlist; // One-to-One relationship. ie. Each `Account` has exactly one `Watchlist`

  constructor(
    user_id: number,
    user_name: string,
    password_hash: string,
    is_admin: boolean,
    watchlist: Watchlist,
  ) {
    this.user_id = user_id;
    this.user_name = user_name;
    this.password_hash = password_hash;
    this.is_admin = is_admin;
    this.watchlist = watchlist;
  }

  // utility method
  static async getLoginCred() {
    return await inquirer.prompt([
      {
        type: "input",
        name: "user_name",
        message: "Enter your username: ",
        required: true,
        validate: function (user_input: string) {
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
    ]); // returns in a Promise, a keyed Object whose keys are `"user_name"` and `"password_hash"` and values are what the user input respectively
  }

  // utility method
  getPublicData(): IAccountPublicData {
    return {
      user_id: this.user_id,
      is_admin: this.is_admin,
      watchlist_id: this.watchlist.watchlist_id,
    };
  }
}

export class Watchlist {
  watchlist_id: number;
  private user_id: number;

  constructor(watchlist_id: number, user_id: number) {
    this.watchlist_id = watchlist_id;
    this.user_id = user_id;
  }
}

// subset of the `Account` class that is safe to be publicly exposed
export interface IAccountPublicData {
  user_id: number;
  is_admin: boolean;
  watchlist_id: number;
}

export class Movie {
  private movie_id: number;
  public title: string;
  public cast: string;
  public category: string;

  constructor(movie_id: number, title: string, cast: string, category: string) {
    this.movie_id = movie_id;
    this.title = title;
    this.cast = cast;
    this.category = category;
  }

  // utility method
  static async getMovieTitle() {
    return await inquirer.prompt([
      {
        type: "input",
        name: "title",
        message: "Enter the name of the movie: ",
        required: true,
        validate: function (user_input: string) {
          if (!user_input) {
            return "Movie title cannot be empty.";
          }
          return true;
        },
      },
    ]);
  }

  // utility method
  static async getMovieDetails() {
    return await inquirer.prompt([
      {
        type: "input",
        name: "title",
        message: "Enter the name of the movie: ",
        required: true,
        validate: function (user_input: string) {
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
  }

  // display method
  static displayMovieList(movieList: Movie[]) {
    const char_num = 25;
    const space = " ";
    const dash = "-";
    const header_row = Object.keys(movieList[0])
      .map((header) => toPascalCase(header))
      .map((header) => `${space}${header.padEnd(char_num, space)}`)
      .join("|");
    // set the display table design to equidistant columns
    console.log(header_row);
    console.log(`${dash.repeat(header_row.length - 1)}`); // `- 1` stopped the jeopady of the design of the table
    // populate table
    movieList.forEach((movie) => {
      const row = Object.keys(movie)
        .map((key) => movie[key as keyof Movie])
        .map((value) => `${space}${value.toString().padEnd(char_num, space)}`)
        .join("|");
      console.log(row);
    });
  }
}

// serves as an associative entity that represents a Many-to-Many relationship between `Watchlist` and `Movie`
class Watchlist_Item {
  private watchlist_id: number; // One-to-Many relationship (ie. An instance of `Watchlist` can contain multiple instances of `Watchlist_Item`.
  // multiple `Watchlist_Item` instances can reference a single instance of `Watchlist`)
  private movie_id: number; // One-to-Many relationship (ie. An instance of `Movie` can be referenced by multiple instances of `Watchlist_Item`.
  // multiple `Watchlist_Item` instances can reference a single instance of `Movie`

  constructor(watchlist_id: number, movie_id: number) {
    // composite Key
    this.watchlist_id = watchlist_id; // foreign key (FK)
    this.movie_id = movie_id; // foreign key (FK)
  }
}
