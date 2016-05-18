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

var recipeDir = '/Users/howardyeend/Sites/auntie/recipes';

var stopwords = ["a","a's","able","about","above","according","accordingly","across","actually","after","afterwards","again","against","ain't","all","allow","allows","almost","alone","along","already","also","although","always","am","among","amongst","an","and","another","any","anybody","anyhow","anyone","anything","anyway","anyways","anywhere","apart","appear","appreciate","appropriate","are","aren't","around","as","aside","ask","asking","associated","at","available","away","awfully","b","be","became","because","become","becomes","becoming","been","before","beforehand","behind","being","believe","below","beside","besides","best","better","between","beyond","both","brief","but","by","c","c'mon","c's","came","can","can't","cannot","cant","cause","causes","certain","certainly","changes","clearly","co","com","come","comes","concerning","consequently","consider","considering","contain","containing","contains","corresponding","could","couldn't","course","currently","d","definitely","described","despite","did","didn't","different","do","does","doesn't","doing","don't","done","down","downwards","during","e","each","edu","eg","eight","either","else","elsewhere","enough","entirely","especially","et","etc","even","ever","every","everybody","everyone","everything","everywhere","ex","exactly","example","except","f","far","few","fifth","first","five","followed","following","follows","for","former","formerly","forth","four","from","further","furthermore","g","get","gets","getting","given","gives","go","goes","going","gone","got","gotten","greetings","h","had","hadn't","happens","hardly","has","hasn't","have","haven't","having","he","he's","hello","help","hence","her","here","here's","hereafter","hereby","herein","hereupon","hers","herself","hi","him","himself","his","hither","hopefully","how","howbeit","however","i","i'd","i'll","i'm","i've","ie","if","ignored","immediate","in","inasmuch","inc","indeed","indicate","indicated","indicates","inner","insofar","instead","into","inward","is","isn't","it","it'd","it'll","it's","its","itself","j","just","k","keep","keeps","kept","know","known","knows","l","last","lately","later","latter","latterly","least","less","lest","let","let's","like","liked","likely","little","look","looking","looks","ltd","m","mainly","many","may","maybe","me","mean","meanwhile","merely","might","more","moreover","most","mostly","much","must","my","myself","n","name","namely","nd","near","nearly","necessary","need","needs","neither","never","nevertheless","new","next","nine","no","nobody","non","none","noone","nor","normally","not","nothing","novel","now","nowhere","o","obviously","of","off","often","oh","ok","okay","old","on","once","one","ones","only","onto","or","other","others","otherwise","ought","our","ours","ourselves","out","outside","over","overall","own","p","particular","particularly","per","perhaps","placed","please","plus","possible","presumably","probably","provides","q","que","quite","qv","r","rather","rd","re","really","reasonably","regarding","regardless","regards","relatively","respectively","right","s","said","same","saw","say","saying","says","second","secondly","see","seeing","seem","seemed","seeming","seems","seen","self","selves","sensible","sent","serious","seriously","seven","several","shall","she","should","shouldn't","since","six","so","some","somebody","somehow","someone","something","sometime","sometimes","somewhat","somewhere","soon","sorry","specified","specify","specifying","still","sub","such","sup","sure","t","t's","take","taken","tell","tends","th","than","thank","thanks","thanx","that","that's","thats","the","their","theirs","them","themselves","then","thence","there","there's","thereafter","thereby","therefore","therein","theres","thereupon","these","they","they'd","they'll","they're","they've","think","third","this","thorough","thoroughly","those","though","three","through","throughout","thru","thus","to","together","too","took","toward","towards","tried","tries","truly","try","trying","twice","two","u","un","under","unfortunately","unless","unlikely","until","unto","up","upon","us","use","used","useful","uses","using","usually","uucp","v","value","various","very","via","viz","vs","w","want","wants","was","wasn't","way","we","we'd","we'll","we're","we've","welcome","well","went","were","weren't","what","what's","whatever","when","whence","whenever","where","where's","whereafter","whereas","whereby","wherein","whereupon","wherever","whether","which","while","whither","who","who's","whoever","whole","whom","whose","why","will","willing","wish","with","within","without","won't","wonder","would","wouldn't","x","y","yes","yet","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves","z","zero"];
stopwords.push('extraordinary');

var cheerio = require('cheerio');
var fs = require('fs');

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
