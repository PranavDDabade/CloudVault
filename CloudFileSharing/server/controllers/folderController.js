const Folder = require('../models/Folder');
const File = require('../models/File');
const User = require('../models/User');
const { deleteFromS3 } = require('../services/s3Service');
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
    const { parentId, search, favorites, limit, sort = 'name' } = req.query;
    const query = { owner: req.user._id, isDeleted: false };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    } else if (favorites === 'true') {
      query.isFavorite = true;
    } else if (parentId === 'all') {
      // Fetch all folders globally
    } else if (parentId === 'root' || !parentId) {
      query.parent = null;
    } else {
      query.parent = parentId;
    }

    let foldersQuery = Folder.find(query).sort(sort);
    if (limit) {
      foldersQuery = foldersQuery.limit(parseInt(limit));
    }
    const folders = await foldersQuery.lean();

    // Add file counts and subfolders count
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
    const { name, color, isFavorite, parentId } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    const oldName = folder.name;

    if (name) {
      folder.name = name;
      // Recursively update descendant path names
      await Folder.updateMany(
        { owner: req.user._id, "path.id": folder._id },
        { $set: { "path.$[elem].name": name } },
        { arrayFilters: [{ "elem.id": folder._id }] }
      );
    }

    if (color) folder.color = color;
    if (isFavorite !== undefined) folder.isFavorite = isFavorite;

    if (parentId !== undefined) {
      const newParentId = parentId === 'root' || !parentId ? null : parentId;
      
      // If we are actually changing parent
      if (String(folder.parent || '') !== String(newParentId || '')) {
        if (newParentId) {
          // Circular reference check
          if (newParentId.toString() === folder._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot move folder into itself.' });
          }
          const parentFolder = await Folder.findOne({ _id: newParentId, owner: req.user._id });
          if (!parentFolder) return res.status(404).json({ success: false, message: 'Parent folder not found.' });
          
          // Check if parent is descendant of current folder
          const isChild = parentFolder.path.some(p => p.id.toString() === folder._id.toString());
          if (isChild) {
            return res.status(400).json({ success: false, message: 'Cannot move folder into its own subfolder.' });
          }
          
          folder.parent = newParentId;
          folder.path = [...parentFolder.path, { id: parentFolder._id, name: parentFolder.name }];
        } else {
          folder.parent = null;
          folder.path = [];
        }

        // Update descendant paths
        const descendants = await Folder.find({ owner: req.user._id, "path.id": folder._id });
        for (const desc of descendants) {
          const idx = desc.path.findIndex(p => p.id.toString() === folder._id.toString());
          if (idx !== -1) {
            desc.path = [...folder.path, { id: folder._id, name: folder.name }, ...desc.path.slice(idx + 1)];
            await desc.save();
          }
        }
      }
    }

    await folder.save();

    await logActivity({
      user: req.user._id,
      action: name && name !== oldName ? 'rename' : 'move',
      resourceType: 'folder',
      resourceId: folder._id,
      resourceName: folder.name,
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Folder updated.', folder });
  } catch (error) {
    next(error);
  }
};

// ── Delete Folder ──────────────────────────────────────────────────────────────
exports.deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

    const deletedAt = new Date();
    
    // Soft delete the folder itself
    folder.isDeleted = true;
    folder.deletedAt = deletedAt;
    await folder.save();

    // Soft delete all subfolders recursively
    const descendants = await Folder.find({ owner: req.user._id, "path.id": folder._id });
    const descendantIds = descendants.map(d => d._id);
    
    if (descendantIds.length > 0) {
      await Folder.updateMany(
        { _id: { $in: descendantIds } },
        { isDeleted: true, deletedAt }
      );
    }

    // Soft delete all files in this folder or subfolders
    const folderIds = [folder._id, ...descendantIds];
    await File.updateMany(
      { owner: req.user._id, folder: { $in: folderIds }, isDeleted: false },
      { isDeleted: true, deletedAt }
    );

    await logActivity({ user: req.user._id, action: 'delete_folder', resourceType: 'folder', resourceId: folder._id, resourceName: folder.name, ip: req.ip });

    res.status(200).json({ success: true, message: 'Folder moved to trash.' });
  } catch (error) {
    next(error);
  }
};

// ── Restore Folder ─────────────────────────────────────────────────────────────
exports.restoreFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: true });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found in trash.' });

    // Restore folder itself
    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();

    // Restore all subfolders recursively
    const descendants = await Folder.find({ owner: req.user._id, "path.id": folder._id, isDeleted: true });
    const descendantIds = descendants.map(d => d._id);
    
    if (descendantIds.length > 0) {
      await Folder.updateMany(
        { _id: { $in: descendantIds } },
        { isDeleted: false, deletedAt: null }
      );
    }

    // Restore all files in this folder or subfolders
    const folderIds = [folder._id, ...descendantIds];
    await File.updateMany(
      { owner: req.user._id, folder: { $in: folderIds }, isDeleted: true },
      { isDeleted: false, deletedAt: null }
    );

    await logActivity({ user: req.user._id, action: 'restore', resourceType: 'folder', resourceId: folder._id, resourceName: folder.name, ip: req.ip });

    res.status(200).json({ success: true, message: 'Folder restored.' });
  } catch (error) {
    next(error);
  }
};

// ── Permanent Delete Folder ───────────────────────────────────────────────────
exports.permanentDeleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: true });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found in trash.' });

    // Find all subfolders recursively
    const descendants = await Folder.find({ owner: req.user._id, "path.id": folder._id });
    const folderIds = [folder._id, ...descendants.map(d => d._id)];

    // Find all files in these folders
    const filesToDelete = await File.find({ owner: req.user._id, folder: { $in: folderIds } });
    
    // Delete files from S3
    await Promise.allSettled(filesToDelete.map(f => deleteFromS3(f.key)));

    // Reclaim storage
    const totalSize = filesToDelete.reduce((sum, f) => sum + f.size, 0);
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -totalSize } });

    // Delete files and folders from DB
    await File.deleteMany({ _id: { $in: filesToDelete.map(f => f._id) } });
    await Folder.deleteMany({ _id: { $in: folderIds } });

    await logActivity({ user: req.user._id, action: 'permanent_delete', resourceType: 'folder', resourceName: folder.name, ip: req.ip });

    res.status(200).json({ success: true, message: 'Folder and all its contents permanently deleted.' });
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
