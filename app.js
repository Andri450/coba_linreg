const express = require("express");
const cors = require("cors");
const router = require("./routes/rt.js");
const AppError = require("./utils/appError");
const errorHandler = require("./utils/errorHandler");
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: false, parameterLimit: 1000000 }));
app.use(bodyParser.json());

// app.use(express.json());
app.use(cors());

app.use(router);

app.all("*", (req, res, next) => {
    next(new AppError(`The URL ${req.originalUrl} does not exists`, 404));
});
app.use(errorHandler);

app.set('view engine', 'ejs');  

const hostname = 'localhost';
const port = 3500;

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;