var s=require("sqlite3"),d=new s.Database("./data/coverscore.db");
d.all("SELECT id,lesson_number,SUBSTR(video_script,1,60) as snippet,video_url FROM academy_modules WHERE course_id=8 ORDER BY lesson_number",[],function(e,r){
  r.forEach(function(m){
    console.log(m.id+" L"+m.lesson_number+" "+(m.video_url||"no-video")+" {"+(m.snippet||"").substring(0,40)+"}");
  });
  d.close();
});
