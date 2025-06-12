const express = require('express');
const router = express.Router();

const articles = [
  { id: 0, title: "How to Act During Floods", author: "Makers Valley Flood Saftey" },
  { id: 1, title: "Article", author: "Not made yet" }
];

router.get('/information', (req, res) => {
  res.render('information', { user: req.user, articles });
});

router.get('/information/article/0', (req, res) => {
  res.render('info0', { user: req.user });
});

router.get('/information/article/:id', (req, res) => {
  const articleId = parseInt(req.params.id, 10);
  // Check if exists
  const article = articles.find(a => a.id === articleId);
  if (!article || articleId === 0) {
    return res.send(`
      <script>
        alert('Error, page not found!');
        window.location.href = '/information';
      </script>
    `);
  }
});

module.exports = router;