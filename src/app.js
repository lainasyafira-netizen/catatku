const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index', { title: 'CatatKu - Dashboard' });
});

app.listen(port, () => {
  console.log(`CatatKu app listening at http://localhost:${port}`);
});
