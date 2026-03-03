const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const ConnectDB = require("../db.js");
const { Software } = require("../Schema.js");

async function addMoreSoftware() {
  await ConnectDB();

  const softwareList = [
    {
      name: "VLC Media Player",
      category: "Multimedia",
      platforms: ["Windows"],
      description:
        "VLC is a free and open-source multimedia player that supports most audio and video formats.",
      version: "3.0.18",
      license: "Open Source",
      repositoryUrl:
        "https://www.dropbox.com/scl/fi/ixncpun3qcbm4aroink0n/vlc-3.0.18-win64.exe?rlkey=2mqt1foqqy2m6p64yc5ffo2xm&st=ilx17w2h&dl=0",
      isPremium: false,
    },
    {
      name: "SHAREit",
      category: "File Transfer",
      platforms: ["Windows"],
      description:
        "SHAREit for Windows lets you transfer files across devices over local network connections.",
      version: "5.0.0.3",
      license: "Freeware",
      repositoryUrl:
        "https://www.dropbox.com/scl/fi/arxfe4hws8pf9q9eoew2l/shareit-5.0.0.3-installer.exe?rlkey=ckosbja6br5g9fnddlilnz14i&st=v2d1u0jj&dl=0",
      isPremium: false,
    },
    {
      name: "WinRAR",
      category: "Utilities",
      platforms: ["Windows"],
      description:
        "WinRAR is a file archiver utility for compressing and extracting RAR, ZIP, and other archive formats.",
      version: "6.22",
      license: "Proprietary",
      repositoryUrl:
        "https://www.dropbox.com/scl/fi/ay9tl9j0k1b1oh3rr934p/winrar-x64-622.exe?rlkey=qyjjkbeclhxc5xft0x8gsy4fs&st=0k2xrs95&dl=0",
      isPremium: false,
    },
  ];

  const inserted = await Software.insertMany(softwareList);
  console.log(`Inserted ${inserted.length} software records.`);
}

addMoreSoftware()
  .catch((error) => {
    console.error("Failed to add software:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
