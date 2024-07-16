class Account {
  user_id: number;
  user_name: string;
  passwrod_hash: string;
  watchlists: Watchlist[]; // One-to-Many relationship. Array of instances of Watchlist

  constructor(user_id: number, user_name: string, passwrod_hash: string) {
    this.user_id = user_id;
    this.user_name = user_name;
    this.passwrod_hash = passwrod_hash;
    this.watchlists = [];
  }
}

interface IAccount {
  user_id: number;
  user_name: string;
  passwrod_hash: string;
  watchlists: Watchlist[];
}

class Watchlist {
  watchlist_id: number;
  user_id: number; // Many-to-One relationship

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

class Watchlist_Item {
  watchlist_id: number;
  movie_ids: Movie[]; // One-to-Many relationship. Array of instances of Movie

  constructor(watchlist_id: number, movie_id: number) {
    this.watchlist_id = watchlist_id;
    this.movie_ids = [];
  }
}
