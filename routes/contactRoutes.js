const express = require('express');
const { body } = require('express-validator');
const { submitContact, getContacts, getContactsByUser, replyToContact, updateStatus } = require('../controllers/contactController');

const router = express.Router();

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').trim().isEmail().withMessage('Valid email is required.'),
    body('subject').trim().notEmpty().withMessage('Subject is required.'),
    body('msg').trim().notEmpty().withMessage('Message is required.'),
    body('phone').optional({ checkFalsy: true }).isLength({ min: 7 }).withMessage('Please enter a valid phone number.'),
  ],
  submitContact
);
router.get('/', getContacts);
router.get('/user/:userId', getContactsByUser);
router.post('/:id/reply', replyToContact);
router.patch('/:id/status', updateStatus);

module.exports = router;
