const http = require('http');

const loginData = JSON.stringify({email:"support@coverscore.site",password:"admin123"});
const loginReq = http.request({
  hostname: "localhost", port: 3016,
  path: "/api/auth/login", method: "POST",
  headers: {"Content-Type":"application/json","Content-Length":loginData.length}
}, (res) => {
  let body = "";
  res.on("data", c => body += c);
  res.on("end", () => {
    const token = JSON.parse(body).accessToken;
    console.log("TOKEN:", token.substring(0,30)+"...");

    const opts = {
      hostname: "localhost", port: 3016,
      path: "/advisor/academy/module/50", method: "GET",
      headers: {"Cookie": "accessToken="+token, "Authorization": "Bearer "+token}
    };
    http.request(opts, (modRes) => {
      console.log("MODULE:", modRes.statusCode);
      let html = "";
      modRes.on("data", c => html += c);
      modRes.on("end", () => {
        // Check for video-related content
        const hasVideoUrl = html.includes("videoUrl") || html.includes("/videos/lesson_");
        const hasVideoTag = html.includes("<video");
        const hasPlaceholder = html.includes("Video coming soon");
        console.log("Has videoUrl in HTML:", hasVideoUrl);
        console.log("Has <video> tag:", hasVideoTag);
        console.log("Has placeholder:", hasPlaceholder);
        if (hasVideoUrl) {
          const match = html.match(/\/videos\/lesson_[^"']+/);
          console.log("Video URL found:", match ? match[0] : "none");
        }
      });
    }).end();
  });
});
loginReq.write(loginData);
loginReq.end();
