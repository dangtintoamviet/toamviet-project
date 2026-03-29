const mongoose = require('mongoose');
const Post = require('../models/Post');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];

  return images
    .map((item) => {
      if (typeof item === 'string' && item.trim()) {
        return { url: item.trim(), alt: '' };
      }

      if (item && typeof item === 'object' && item.url) {
        return {
          url: String(item.url).trim(),
          alt: String(item.alt || '').trim()
        };
      }

      return null;
    })
    .filter(Boolean);
}

function buildPostPayload(body) {
  return {
    flow: body.flow || 'real_estate',
    postType: body.postType || 'ban',
    propertyCategory: body.propertyCategory || '',
    serviceType: body.serviceType || '',
    title: body.title || body.postTitle || '',
    description: body.description || body.postDescription || '',
    city: body.city || '',
    district: body.district || '',
    ward: body.ward || '',
    addressDetail: body.addressDetail || '',
    projectName: body.projectName || body.newProjectName || '',
    projectDeveloper: body.projectDeveloper || '',
    price: Number(body.price || body.propertyPrice || 0),
    area: Number(body.area || body.propertyArea || 0),
    legal: body.legal || body.propertyLegal || '',
    direction: body.direction || body.propertyDirection || '',
    bedrooms: Number(body.bedrooms || body.propertyBeds || 0),
    servicePrice: Number(body.servicePrice || 0),
    serviceExperience: body.serviceExperience || body.serviceExp || '',
    serviceArea: body.serviceArea || '',
    serviceBrand: body.serviceBrand || '',
    serviceSpecialty: body.serviceSpecialty || '',
    contactName: body.contactName || '',
    contactPhone: body.contactPhone || '',
    contactEmail: body.contactEmail || '',
    images: normalizeImages(body.images),
    thumbnail: body.thumbnail || '',
    vipLevel: body.vipLevel || 'thuong'
  };
}

const getPosts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.flow) filter.flow = req.query.flow;
  if (req.query.postType) filter.postType = req.query.postType;
  if (req.query.city) filter.city = req.query.city;
  if (req.query.createdBy && mongoose.Types.ObjectId.isValid(req.query.createdBy)) {
    filter.createdBy = req.query.createdBy;
  }

  if (req.query.q) {
    filter.$or = [
      { title: { $regex: req.query.q, $options: 'i' } },
      { description: { $regex: req.query.q, $options: 'i' } },
      { city: { $regex: req.query.q, $options: 'i' } },
      { district: { $regex: req.query.q, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'fullName phone email role'),
    Post.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

const getPostBySlug = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate(
    'createdBy',
    'fullName phone email role'
  );

  if (!post) {
    throw new AppError('Không tìm thấy tin đăng.', 404);
  }

  res.status(200).json({
    success: true,
    data: { item: post }
  });
});

const createPost = asyncHandler(async (req, res) => {
  const payload = buildPostPayload(req.body);
  payload.createdBy = req.user._id;

  if (!payload.title || !payload.description || !payload.contactName || !payload.contactPhone) {
    throw new AppError('Thiếu thông tin bắt buộc của tin đăng.', 400);
  }

  const post = await Post.create(payload);

  res.status(201).json({
    success: true,
    message: 'Tạo tin đăng thành công. Tin đang chờ duyệt.',
    data: { item: post }
  });
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Không tìm thấy tin đăng.', 404);
  }

  const isOwner = String(post.createdBy) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền sửa tin này.', 403);
  }

  const payload = buildPostPayload(req.body);
  Object.assign(post, payload);

  if (!isAdmin) {
    post.status = 'pending';
    post.rejectReason = '';
    post.approvedAt = null;
    post.approvedBy = null;
  }

  await post.save();

  res.status(200).json({
    success: true,
    message: 'Cập nhật tin đăng thành công.',
    data: { item: post }
  });
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Không tìm thấy tin đăng.', 404);
  }

  const isOwner = String(post.createdBy) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Bạn không có quyền xóa tin này.', 403);
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Đã xóa tin đăng thành công.'
  });
});

const approvePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Không tìm thấy tin đăng.', 404);
  }

  post.status = 'approved';
  post.rejectReason = '';
  post.approvedAt = new Date();
  post.approvedBy = req.user._id;
  await post.save();

  res.status(200).json({
    success: true,
    message: 'Đã duyệt tin đăng.',
    data: { item: post }
  });
});

const rejectPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Không tìm thấy tin đăng.', 404);
  }

  post.status = 'rejected';
  post.rejectReason = String(req.body.reason || '').trim();
  post.approvedAt = null;
  post.approvedBy = null;
  await post.save();

  res.status(200).json({
    success: true,
    message: 'Đã từ chối tin đăng.',
    data: { item: post }
  });
});

module.exports = {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  approvePost,
  rejectPost
};
