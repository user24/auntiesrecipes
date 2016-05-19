/*jslint -W110, node:true*/
/*

Process BBC Food Recipes into a sparse JSON format
A fairly hacky scraper.

1) Download all the recipes: wget --quiet http://www.bbc.co.uk/food/sitemap.xml --output-document - | egrep -o "https?://www.bbc.co.uk/food/recipes/[^&lt;]+" | wget -i -
2) Edit recipeDir to point to the folder that contains the files
3) node --max-old-space-size=8192 scrape.js 
4) Read titles.json

Let me know what you build, I'd love to hear about it; @user24

This script is very loosely based on https://github.com/forbesg/bbc-good-food-recipe-scraper

*/
'use strict';

var cheerio = require('cheerio');
var fs = require('fs');
var stopwords = require('./stopwords.json');

var recipeDir = process.env.RECIPE_DIR || "../recipe_download/";

function readFile(filename, onFileContent, onError) {
    fs.readFile(filename, 'utf-8', function(err, content) {
        if (err) {
            onError(err);
            return;
        }
        
        onFileContent(filename, content);
    });
}

function readFiles(dirname, onFileContent, onError, onComplete) {
  
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
        onError(err);
        return;
    }
    
    var results = [];
    var running = 0;
    var limit = 200;

    function async(item, cb) {
        readFile(dirname + '/' + item, function (filename, content) {
            onFileContent(filename, content);
            cb();
        }, function (err) {
            console.error(err);
        });
    }
    
    // For dev; only process first few recipes
    //filenames = filenames.slice(0, 300);
    
    // Run in batches to keep open file descriptors down
    // via http://stackoverflow.com/a/21871527
    function launcher() {
        while(running < limit && filenames.length > 0) {
            var item = filenames.shift();
            async(item, function(result) {
                results.push(result);
                running--;
                if(filenames.length > 0) {
                    launcher();
                } else if(running == 0) {
                    onComplete();
                }
            });
        running++;
        }
    }

    launcher();
      
    //readFile(dirname + '/' + filenames[Math.floor(Math.random() * filenames.length)], onFileContent, onError);
    //return;
  });
}

// Converts PT30M to '30' and PT2H to '120'
// Cooking Times are returned in ISO 8601 format (PT2H)
function parseTime(time) {
	if (!time) {
		return null;
	}
	time = time.substring(2);
	if (time.indexOf("M") > -1) {
		time = parseInt(time);
	} else if (time.indexOf("H") > -1) {
		time = parseInt(time) * 60;
	}
	return time;
}

var titleDB = {};
var shorterLookups = [];
var db = {};

readFiles(recipeDir, function (name, html) {
	var recipe = {
		ingredients: [],
		method:[],
	};

	recipe.url = name.substring(recipeDir.length + 1);
    recipe.url = recipe.url.substring(0, recipe.url.length - 5);
	var $ = cheerio.load(html);

	recipe.title = $('h1.content-title__text').text().trim();
    if (!recipe.title) {
        return;
    }
	$('.recipe-ingredients__list-item').each(function (index, item) {
		// Trim string up to line break where ingredient anchor description starts
		var lineBreak = $(this).text().indexOf('\n');
		if (lineBreak > 0) {
			recipe.ingredients.push($(this).text().substring(0, lineBreak));
		} else {
			recipe.ingredients.push($(this).text());
		}

	});
	$('.recipe-method__list-item-text').each(function (index, item) {
		recipe.method.push($(this).text());
	});
	
	recipe.time = {
		preparation: $('.recipe-metadata__prep-time').text(),
		preparationMins: parseTime($('.recipe-metadata__prep-time').attr('content')),
		cooking: $('.recipe-metadata__cook-time').text(),
		cookingMins: parseTime($('.recipe-metadata__cook-time').attr('content'))
	};
	recipe.time.totalMins = recipe.time.preparationMins + recipe.time.cookingMins;

	recipe.serves = $('.recipe-metadata__serving').text();
	recipe.image = $('meta[property="og:image"]').attr('content');
    if (recipe.image.indexOf("bbc_placeholder.png") > -1) {
        delete recipe.image;
    }
	recipe.isVegetarian = $('.recipe-metadata__dietary-vegetarian').length ? true : false;
    
    recipe.recommendations = parseInt($('.recipe-metadata__recommendations').text()) || 0;

    // Create a sparse data format from the recipe
    var recipeData = {};

    recipeData.t = recipe.title;
    recipeData.l = recipe.ingredients.length;
    
    if (recipe.image) {
        recipeData.i = 1;
    }
    if (recipe.isVegetarian) {
        recipeData.v = 1;
    }
    if (recipe.time.preparationMins) {
        recipeData.p = recipe.time.preparationMins;
    }
    if (recipe.time.cookingMins) {
        recipeData.c = recipe.time.cookingMins;
    }
    if (recipe.recommendations) {
        recipeData.r = recipe.recommendations;
    }
    titleDB[recipe.url] = recipeData;

/*
    recipe.title.toLowerCase().split(' ').forEach(function (word) {
        word = word.replace(/[^a-z]/g, '');
        if (word.length < 3 || stopwords.indexOf(word) > -1) {
            return;
        }
        if (!db[word]) {
            db[word] = [];
        }
        db[word].push(recipe.url);
    });
    */
}, function (err) {
	console.log(err);
}, function () {
    fs.writeFile('titles.json', JSON.stringify(titleDB));
    //fs.writeFile('shorterlookups.json', JSON.stringify(shorterLookups));
    //fs.writeFile('db.json', JSON.stringify(db));
    return;
    var str = "";
    /*
    lookups.forEach(function (e) {
        str += JSON.stringify(e);
    });
    */
    str = JSON.stringify(db);
    console.log(str);
});
