const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const ConnectDB = require("../db.js");
const { Software } = require("../Schema.js");

async function truncateAndSeedSoftware() {
  await ConnectDB();

  await Software.deleteMany({});

  const softwareList = [
    {
      name: "Python",
      category: "Developer Tools",
      platforms: ["Windows"],
      description:
        "Python programming language installer for Windows, used for scripting, automation, and development.",
      version: "3.13.0",
      license: "Open Source",
      repositoryUrl:
        "https://www.dropbox.com/scl/fi/be73hakuntnvfsl0ofnmt/python-3.13.0-amd64.exe?rlkey=l65bzqsf586pfxpyyrcxwdpj9&st=krnzluky&dl=0",
      isPremium: false,
    },
    {
      name: "Rufus",
      category: "Utilities",
      platforms: ["Windows"],
      description:
        "Rufus is a utility to create bootable USB drives from ISO files quickly and reliably.",
      version: "4.1",
      license: "Open Source",
      repositoryUrl:
        "https://www.dropbox.com/scl/fi/uz9ao215um4cm69cxhode/rufus-4.1.exe?rlkey=jvkp82eqo10ujcjs8vqalb18j&st=w6siyn2u&dl=0",
      isPremium: false,
    },
    {
      name: "Internet Download Manager (IDM)",
      category: "Download Manager",
      platforms: ["Windows"],
      description:
        "IDM accelerates downloads and provides resume and scheduling features for large files.",
      version: "6.42 Build 31",
      license: "Proprietary",
      repositoryUrl:
        "https://www.dropbox.com/scl/fi/8d3nsjui4qabs0y24ozeh/idman642build31.exe?rlkey=1l9chz7mj11ixdcv3d1j69lkk&st=skxk339m&dl=0",
      isPremium: true,
    },
  ];

  const inserted = await Software.insertMany(softwareList);
  console.log(`Inserted ${inserted.length} software records.`);
}

truncateAndSeedSoftware()
  .catch((error) => {
    console.error("Failed to truncate/seed software:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
