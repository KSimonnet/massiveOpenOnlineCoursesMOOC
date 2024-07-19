# Initialise your EDI

1. In your preferred EDI (Integrated Development Environment), open the root directory `src` of the project

2. In your EDI, open two split Terminals aka CLI (Command Line Interface)
3. In one, navigate to: `src/Frontend` by running:
   `$ cd ./frontend`
4. In the other one, navigate to: `src/BackEnd-Apis` by running:
   `$ cd ./backend-apis`

## Install dependencies

1. In both the Terminals (`src/Frontend`, `src/BackEnd-Apis`) run teh below command:
   `$ npm install`

2. In the the Terminal for the Backend-Apis folder (`src/BackEnd-Apis`), run the below command:
   `$ npm install typescript ts-node express body-parser cors msnodesqlv8`

### Open the application

A TypeScript file `index.ts` is located both, Frontend and BackEnd-Apis folders (`src/Frontend`, `src/BackEnd-Apis`)

1. In `src/Frontend`, run the below command:
   `$ npm run start`. It should output to the Terminal: "Please log in or sign up:"
2. In `src/BackEnd-Apis`, run below command:
   `$ npm start`
   It should output to the Terminal: `BE server running`
