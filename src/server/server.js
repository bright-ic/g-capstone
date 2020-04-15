const express = require('express');
const cors = require("cors");
const path = require("path");

const app = express()

app.use(express.static('dist'));
app.use(cors());

app.get('/', function (req, res) {
     res.sendFile(path.resolve(__dirname,"../../dist", "index.html"))
})

app.get('/details', function (req, res) {
    res.sendFile(path.resolve(__dirname,"../../dist", "details.html"))
})

// designates what port the app will listen to for incoming requests
app.listen(8020, function () {
    console.log('App is listening on port 8020 !')
});


module.exports = app;