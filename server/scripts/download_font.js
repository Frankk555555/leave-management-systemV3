const https = require("https");
const fs = require("fs");
const path = require("path");

const fontUrl =
  "https://github.com/google/fonts/raw/main/ofl/mitr/Mitr-Regular.ttf";
const dest = path.join(__dirname, "../fonts/Mitr-Regular.ttf");

const downloadFont = () => {
  const file = fs.createWriteStream(dest);
  https
    .get(fontUrl, { headers: { "User-Agent": "Node.js" } }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log("Font downloaded successfully!");
          });
        });
        return;
      }

      if (response.statusCode !== 200) {
        console.error(`Failed to download font: ${response.statusCode}`);
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log("Font downloaded successfully!");
      });
    })
    .on("error", (err) => {
      fs.unlink(dest, () => {});
      console.error("Error:", err.message);
    });
};

downloadFont();
