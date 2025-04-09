const profiles = require("../models/profiles.model");
const cloudinary = require("../cloud/connectionCloadinary");

const updateProfileFields = async (req, res) => {
  const { accID } = req.params;
  const updateFields = req.body;

  try {
    if (!accID || !updateFields) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Update the profile by accID
    const updatedProfile = await profiles.findOneAndUpdate(
      { accID }, // Find profile by accID
      { $set: updateFields }, // Set the fields to be updated
      { new: true } // Return the updated profile
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    return res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ message: "Error updating profile" });
  }
};

const updatePhotos_Pf_CoV = async (req, res) => {
  try {
    const { accID } = req.params;
    const profile = await profiles.findOne({ accID });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const updates = {};

    if (req.files && req.files["photoProfile"]) {
      if (profile.profileCloudId) {
        cloudinary.uploader.destroy(profile.profileCloudId);
      }

      const uploadResult = await cloudinary.uploader.upload(
        req.files["photoProfile"][0].path,
        {
          folder: "kh24/profiles_photos/photoProfiles",
          public_id: `${
            profile.firstName + profile.lastName
          }_photoProfile_${Date.now()}`,
        }
      );

      updates.photoProfile = uploadResult.secure_url;
      updates.profileCloudId = uploadResult.public_id;
    } else if (req.files && req.files["photoCover"]) {
      if (profile.coverCloudId) {
        cloudinary.uploader.destroy(profile.coverCloudId);
      }
      const uploadResult = await cloudinary.uploader.upload(
        req.files["photoCover"][0].path,
        {
          folder: "kh24/profiles_photos/photoCovers",
          public_id: `${
            profile.firstName + profile.lastName
          }_photoCover_${Date.now()}`,
        }
      );

      updates.photoCover = uploadResult.secure_url;
      updates.coverCloudId = uploadResult.public_id;
    }

    // Update the profile in the database
    const updatedProfile = await profiles.findOneAndUpdate(
      { accID: accID },
      { $set: updates },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Failed to update profile" });
    }
    res.json({
      message: "Profile photo updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating profile photo" });
  }
};

module.exports = { updateProfileFields, updatePhotos_Pf_CoV };
