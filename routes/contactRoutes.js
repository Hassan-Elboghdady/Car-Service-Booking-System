const express = require('express');
const { submitContact, getContacts, getContactsByUser, replyToContact, updateStatus } = require('../controllers/contactController');

const router = express.Router();

router.post('/', submitContact);
router.get('/', getContacts);
router.get('/user/:userId', getContactsByUser);
router.post('/:id/reply', replyToContact);
router.patch('/:id/status', updateStatus);

module.exports = router;
