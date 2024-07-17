class Account {
  user_id: number;
  user_name: string;
  password_hash: string;
  watchlist: Watchlist; // One-to-One relationship. ie. Each `Account` has exactly one `Watchlist`

  constructor(
    user_id: number,
    user_name: string,
    password_hash: string,
    watchlist_id: number,
  ) {
    this.user_id = user_id;
    this.user_name = user_name;
    this.password_hash = password_hash;
    this.watchlist = new Watchlist(watchlist_id, user_id);
  }
}

interface IAccount {
  user_id: number;
  user_name: string;
  passwrod_hash: string;
  watchlist: Watchlist;
}

class Watchlist {
  watchlist_id: number;
  user_id: number;

  constructor(watchlist_id: number, user_id: number) {
    this.watchlist_id = watchlist_id;
    this.user_id = user_id;
  }
}

class Movie {
  movie_id: number;
  title: string;
  cast: string;
  category: string;

  constructor(movie_id: number, title: string, cast: string, category: string) {
    this.movie_id = movie_id;
    this.title = title;
    this.cast = cast;
    this.category = category;
  }
}

// serves as an associative entity that represents a Many-to-Many relationship between `Watchlist` and `Movie`
class Watchlist_Item {
  watchlist_id: number; // One-to-Many relationship (ie. An instance of `Watchlist` can contain multiple instances of `Watchlist_Item`.
  // multiple `Watchlist_Item` instances can reference a single instance of `Watchlist`)
  movie_id: number; // One-to-Many relationship (ie. An instance of `Movie` can be referenced by multiple instances of `Watchlist_Item`.
  // multiple `Watchlist_Item` instances can reference a single instance of `Movie`

  constructor(watchlist_id: number, movie_id: number) {
    // composite Key
    this.watchlist_id = watchlist_id; // foreign key (FK)
    this.movie_id = movie_id; // foreign key (FK)
  }
}
