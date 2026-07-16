// Dieselpunk portrait plates, assigned by a general's personality trait
export const TRAIT_PORTRAITS = {
  butcher: "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/0b7ea6dfc_generated_image.png",
  fox: "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/c00f1ec71_generated_image.png",
  bulwark: "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/bedbf59f5_generated_image.png",
  firebrand: "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/0a4af1f98_generated_image.png",
};

export const SUPREME_PORTRAIT =
  "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/0934eb565_generated_image.png";

export function getGeneralPortrait(general) {
  if (!general) return null;
  if (general.supreme) return SUPREME_PORTRAIT;
  return TRAIT_PORTRAITS[general.trait] || TRAIT_PORTRAITS.bulwark;
}