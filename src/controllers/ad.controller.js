const adModel = require("../models/ad.model");
const cloudinary = require("../cloud/connectionCloadinary");

exports.create = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const { file } = req;

    if (!file || !startDate || !endDate) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "kh24/ad",
    });

    const newAd = new adModel({
      image: uploadResult.secure_url,
      cloudinary_id: uploadResult.public_id,
      startDate,
      endDate,
      isActive: true,
    });

    await newAd.save();
    res.status(200).json(newAd);
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

exports.findByPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const ads = await adModel
      .find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAds = await adModel.countDocuments();

    res.json({
      ads,
      totalAds,
      totalPages: Math.ceil(totalAds / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAdFiveLimit = async (req, res) => {
  try {
    const ads = await adModel
      .find({
        startDate: { $lte: new Date() },
        endDate: { $gt: new Date() },
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("image")
      .lean();

    res.json({
      ads: ads,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const ad = await adModel.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { startDate, endDate, isActive } = req.body;
    const adId = req.params.id;
    let imageUrl, cloudinary_id;

    if (req.file) {
      const adToUpdate = await adModel.findById(adId);
      if (adToUpdate && adToUpdate.cloudinary_id) {
        await cloudinary.uploader.destroy(adToUpdate.cloudinary_id);
      }
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "kh24/ad",
      });

      imageUrl = uploadResult.secure_url;
      cloudinary_id = uploadResult.public_id;
    } else {
      const adToUpdate = await adModel.findById(adId);
      imageUrl = adToUpdate.image;
      cloudinary_id = adToUpdate.cloudinary_id;
    }

    const updatedAd = await adModel.findByIdAndUpdate(
      adId,
      {
        image: imageUrl,
        cloudinary_id: cloudinary_id,
        startDate,
        endDate,
        isActive: isActive || true,
      },
      { new: true }
    );

    if (!updatedAd) {
      return res.status(404).json({ message: "Ad not found" });
    }

    res.json(updatedAd);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const adToDelete = await adModel.findById(req.params.id);
    if (!adToDelete) return res.status(404).json({ message: "Ad not found" });

    await cloudinary.uploader.destroy(adToDelete.cloudinary_id);
    await adModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Ad and image deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
