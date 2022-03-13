const express = require('express');

const app = express();
const PORT = 5000;

app.set('view engine', 'hbs');

app.use('/public', express.static(__dirname + '/public'))

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/contact-me', function(req, res) {
    res.render('contact-me');
});

app.get('/detail-project', function(req, res) {
    res.render('detail-project');
});

app.get('/add-project', function(req, res) {
    res.render('add-project');
});

app.listen(PORT, function () {
    console.log(`Server starting on PORT: ${PORT}`)
});

