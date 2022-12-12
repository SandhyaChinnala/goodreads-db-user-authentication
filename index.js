const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//create user API
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const selectUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}'`;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    //create user in user table
    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`;
    await db.run(createUserQuery);
    response.send("User Created Successfully");
  } else {
    //send invalid username as response
    response.status(400);
    response.send("UserName already exists");
  }
});

//login user API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
  SELECT
    *
  FROM
    user
  WHERE
    username = '${username}';`;

  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    //user doesn't exists
    response.status(400);
    response.send("Invalid User");
  } else {
    //compare password, hashedPassword
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      //login success
      response.send("Login Success!");
    } else {
      //invalid password
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//get all users API
app.get("/users/", async (request, response) => {
  const getUsersQuery = `
  SELECT
    *
  FROM
    user;`;
  const usersArray = await db.all(getUsersQuery);
  response.send(usersArray);
});

//delete user API
app.delete("/users/", async (request, response) => {
  const { name } = request.body;
  const deleteUserQuery = `
        DELETE FROM user
        WHERE name = '${name}';
    `;
  await db.run(deleteUserQuery);
  response.send("user deleted");
});
