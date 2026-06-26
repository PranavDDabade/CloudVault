const Folder = require('../models/Folder');
const File = require('../models/File');
const { logActivity } = require('../utils/helpers');

// ── Create Folder ─────────────────────────────────────────────────────────────
exports.createFolder = async (req, res, next) => {
  try {
    const { name, parentId, color } = req.body;

    let path = [];
    if (parentId) {
      const parent = await Folder.findOne({ _id: parentId, owner: req.user._id });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent folder not found.' });
      path = [...(parent.path || []), { id: parent._id, name: parent.name }];
    }

    // Check duplicate name in same location
    const existing = await Folder.findOne({ name, owner: req.user._id, parent: parentId || null, isDeleted: false });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A folder with this name already exists here.' });
    }

    const folder = await Folder.create({
      name,
      owner: req.user._id,
      parent: parentId || null,
      color: color || '#4F46E5',
      path,
    });

    await logActivity({
      user: req.user._id,
      action: 'create_folder',
      resourceType: 'folder',
      resourceId: folder._id,
      resourceName: folder.name,
      ip: req.ip,
    });

    res.status(201).json({ success: true, message: 'Folder created.', folder });
  } catch (error) {
    next(error);
  }
};

// ── Get Folders ────────────────────────────────────────────────────────────────
exports.getFolders = async (req, res, next) => {
  try {
    const { parentId, search } = req.query;
    const query = { owner: req.user._id, isDeleted: false };

    if (parentId === 'root' || !parentId) {
      query.parent = null;
    } else {
      query.parent = parentId;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const folders = await Folder.find(query).sort('name').lean();

    // Add file counts
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const fileCount = await File.countDocuments({ folder: folder._id, isDeleted: false });
        const subfolderCount = await Folder.countDocuments({ parent: folder._id, isDeleted: false });
        return { ...folder, fileCount, subfolderCount };
      })
    );

    res.status(200).json({ success: true, folders: foldersWithCounts });
  } catch (error) {
    next(error);
  }
};

// ── Get Single Folder ──────────────────────────────────────────────────────────
exports.getFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id }).populate('parent', 'name');
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    const fileCount = await File.countDocuments({ folder: folder._id, isDeleted: false });
    const subfolders = await Folder.find({ parent: folder._id, isDeleted: false }).sort('name');

    res.status(200).json({ success: true, folder: { ...folder.toObject(), fileCount }, subfolders });
  } catch (error) {
    next(error);
  }
};

// ── Update Folder ──────────────────────────────────────────────────────────────
exports.updateFolder = async (req, res, next) => {
  try {
    const { name, color, isFavorite } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    if (name) folder.name = name;
    if (color) folder.color = color;
    if (isFavorite !== undefined) folder.isFavorite = isFavorite;

    await folder.save();

    await logActivity({ user: req.user._id, action: 'rename', resourceType: 'folder', resourceId: folder._id, resourceName: folder.name, ip: req.ip });

    res.status(200).json({ success: true, message: 'Folder updated.', folder });
  } catch (error) {
    next(error);
  }
};

// ── Delete Folder ──────────────────────────────────────────────────────────────
exports.deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    // Soft delete folder and its files
    folder.isDeleted = true;
    folder.deletedAt = new Date();
    await folder.save();

    await File.updateMany(
      { folder: folder._id, owner: req.user._id },
      { isDeleted: true, deletedAt: new Date() }
    );

    await logActivity({ user: req.user._id, action: 'delete_folder', resourceType: 'folder', resourceId: folder._id, resourceName: folder.name, ip: req.ip });

    res.status(200).json({ success: true, message: 'Folder moved to trash.' });
  } catch (error) {
    next(error);
  }
};

// ── Get Breadcrumb Path ────────────────────────────────────────────────────────
exports.getBreadcrumb = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    const breadcrumb = [
      ...(folder.path || []),
      { id: folder._id, name: folder.name },
    ];

    res.status(200).json({ success: true, breadcrumb });
  } catch (error) {
    next(error);
  }
};
