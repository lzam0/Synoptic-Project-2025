const express = require('express');
const router = express.Router();

router.get('/data-visualisation', (req, res) => {
    res.render('data-visualisation');
});

module.exports = router;