const mongoose = require('mongoose');
const createSlug = require('../utils/slugify.util');

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },
    alt: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    flow: {
      type: String,
      enum: ['real_estate', 'construction'],
      default: 'real_estate'
    },
    postType: {
      type: String,
      enum: ['ban', 'thue', 'xaydung'],
      default: 'ban'
    },
    propertyCategory: {
      type: String,
      default: ''
    },
    serviceType: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề tin'],
      trim: true,
      maxlength: 180
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Vui lòng nhập mô tả tin'],
      trim: true
    },
    city: {
      type: String,
      default: ''
    },
    district: {
      type: String,
      default: ''
    },
    ward: {
      type: String,
      default: ''
    },
    addressDetail: {
      type: String,
      default: ''
    },
    projectName: {
      type: String,
      default: ''
    },
    projectDeveloper: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    area: {
      type: Number,
      default: 0,
      min: 0
    },
    legal: {
      type: String,
      default: ''
    },
    direction: {
      type: String,
      default: ''
    },
    bedrooms: {
      type: Number,
      default: 0,
      min: 0
    },
    servicePrice: {
      type: Number,
      default: 0,
      min: 0
    },
    serviceExperience: {
      type: String,
      default: ''
    },
    serviceArea: {
      type: String,
      default: ''
    },
    serviceBrand: {
      type: String,
      default: ''
    },
    serviceSpecialty: {
      type: String,
      default: ''
    },
    contactName: {
      type: String,
      required: [true, 'Vui lòng nhập tên liên hệ'],
      trim: true,
      maxlength: 120
    },
    contactPhone: {
      type: String,
      required: [true, 'Vui lòng nhập số điện thoại liên hệ'],
      trim: true
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    images: {
      type: [imageSchema],
      default: []
    },
    thumbnail: {
      type: String,
      default: ''
    },
    vipLevel: {
      type: String,
      enum: ['thuong', 'dong', 'bac', 'vang', 'kim-cuong'],
      default: 'thuong'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'hidden'],
      default: 'pending'
    },
    rejectReason: {
      type: String,
      default: ''
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

postSchema.pre('validate', function buildSlug(next) {
  if (!this.slug && this.title) {
    const suffix = Date.now().toString().slice(-6);
    this.slug = `${createSlug(this.title)}-${suffix}`;
  }

  if (!this.thumbnail && Array.isArray(this.images) && this.images.length > 0) {
    this.thumbnail = this.images[0].url;
  }

  next();
});

module.exports = mongoose.model('Post', postSchema);
