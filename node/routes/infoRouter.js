const express = require('express');
const router = express.Router();

const articles = [
  { id: 0, title: "How to Act During Floods", author: "Makers Valley Flood Saftey" },
  { id: 1, title: "Recycling in Johannesburg", author: "John Smith" },
  { id: 2, title: "Understanding Waste Management", author: "Alex Lee" },
  { id: 3, title: "Preventing Urban Flooding", author: "Sam Patel" }
];

router.get('/information', (req, res) => {
  res.render('information', { user: req.user, articles });
});

router.get('/information/article/0', (req, res) => {
  res.render('info0', { user: req.user });
});

router.get('/information/article/:id', (req, res) => {
  if (req.params.id === '0') return res.render('info0', { user: req.user });
  res.render('information', { user: req.user, articleId: req.params.id });
});

module.exports = router;