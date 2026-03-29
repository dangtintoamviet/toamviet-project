const express = require('express');
const {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  approvePost,
  rejectPost
} = require('../controllers/post.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', getPosts);
router.get('/:slug', getPostBySlug);

router.post('/', protect, createPost);
router.patch('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.patch('/:id/approve', protect, restrictTo('admin'), approvePost);
router.patch('/:id/reject', protect, restrictTo('admin'), rejectPost);

module.exports = router;
