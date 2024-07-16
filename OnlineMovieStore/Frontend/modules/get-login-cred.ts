import * as inquirer from "inquirer";

export async function getLoginCred() {
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
  ]);
}
