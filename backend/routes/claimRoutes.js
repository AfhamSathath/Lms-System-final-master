const express = require('express');
const router = express.Router();
const { getClaims, createClaim, deleteClaim } = require('../controllers/claimController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getClaims)
  .post(createClaim);

router.route('/:id')
  .delete(deleteClaim);

module.exports = router;
