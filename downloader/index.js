"use strict"

let request = require('request');
let Parser = require('./parser.js');
let async = require('async');
let fs = require('fs');

function getSiteMap() {
  return new Promise((resolve, reject) => {
     request.get({"url": "http://www.bbc.co.uk/food/sitemap.xml"}, (err,res,body) => {
         var parser = new Parser();
         parser.parse(body, (err, doc) => {
            resolve(doc);
         });
      });
   });
}

getSiteMap()
.then((urls)=> {
    return new Promise((resolve, reject) => {
        var tasks = [];
        urls.forEach((url) => {
            if(url.length > 0) {
                let outfile = url.substring(url.lastIndexOf("\/\/")+2);
                outfile = outfile.replace(/\//g, "_");
                outfile = outfile.replace(/\./g, "_") + ".html";
                tasks.push({ url: url, outfile: outfile });
            }
        });
        resolve(tasks);
    });
})
.then(tasks => {
  console.log("tasks ready " + tasks.length);
  var q = async.queue((task, done) => {
      process.stdout.write(".")
      request.get(task.url, (err,res,body) => {
          fs.writeFile("html/" + task.outfile, body, "utf8", () => {
              process.stdout.write("-")
            // console.log("Written: " + task.outfile);
            setImmediate(done);              
          });
      });
  }, 10);
  q.drain = () => {
      console.log("Everything has been downloaded.")
  };
  for(let i = 0;i < tasks.length; i++) {
     q.push(tasks[i]);
  }
//  tasks.forEach((t)=> { q.push(t); });
})
.catch((e) => {
   console.error(e);
});

