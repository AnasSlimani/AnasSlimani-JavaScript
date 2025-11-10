const express = require("express");
const connectDB = require("./config/db");
const bcrypt = require("bcrypt");

const booksRouter = require("./books");
const usersRouter = require("./users");
const User = require("./models/user");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
connectDB();

app.use(
  "/books",
  async (req, res, next) => {
    // middleware d'authentification
    const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
    //recupération des identifiants from session
    const [loginDecoded, passwordDecoded] = Buffer.from(b64auth, "base64")
      .toString()
      .split(":");

    const auth = await User.findOne({ username: loginDecoded });

    if (auth && (await bcrypt.compare(passwordDecoded, auth.password))) {
      return next();
    }

    res.send("Unauthorized");
    return res.status(401).end();
  },
  booksRouter
);

app.use("/users", usersRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
