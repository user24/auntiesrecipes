
/*jslint -W110, sloppy:true*/
/*global $*/
var prom = $.Deferred();
$.getJSON('./code/titles.json').fail(prom.reject).done(function (recipes) {
    Object.keys(recipes).forEach(function (url) {
        recipes[url].u = url;
    });
    prom.resolve(recipes);
});

var stopwords = ["a","a's","able","about","above","according","accordingly","across","actually","after","afterwards","again","against","ain't","all","allow","allows","almost","alone","along","already","also","although","always","am","among","amongst","an","and","another","any","anybody","anyhow","anyone","anything","anyway","anyways","anywhere","apart","appear","appreciate","appropriate","are","aren't","around","as","aside","ask","asking","associated","at","available","away","awfully","b","be","became","because","become","becomes","becoming","been","before","beforehand","behind","being","believe","below","beside","besides","best","better","between","beyond","both","brief","but","by","c","c'mon","c's","came","can","can't","cannot","cant","cause","causes","certain","certainly","changes","clearly","co","com","come","comes","concerning","consequently","consider","considering","contain","containing","contains","corresponding","could","couldn't","course","currently","d","definitely","described","despite","did","didn't","different","do","does","doesn't","doing","don't","done","down","downwards","during","e","each","edu","eg","eight","either","else","elsewhere","enough","entirely","especially","et","etc","even","ever","every","everybody","everyone","everything","everywhere","ex","exactly","example","except","f","far","few","fifth","first","five","followed","following","follows","for","former","formerly","forth","four","from","further","furthermore","g","get","gets","getting","given","gives","go","goes","going","gone","got","gotten","greetings","h","had","hadn't","happens","hardly","has","hasn't","have","haven't","having","he","he's","hello","help","hence","her","here","here's","hereafter","hereby","herein","hereupon","hers","herself","hi","him","himself","his","hither","hopefully","how","howbeit","however","i","i'd","i'll","i'm","i've","ie","if","ignored","immediate","in","inasmuch","inc","indeed","indicate","indicated","indicates","inner","insofar","instead","into","inward","is","isn't","it","it'd","it'll","it's","its","itself","j","just","k","keep","keeps","kept","know","known","knows","l","last","lately","later","latter","latterly","least","less","lest","let","let's","like","liked","likely","little","look","looking","looks","ltd","m","mainly","many","may","maybe","me","mean","meanwhile","merely","might","more","moreover","most","mostly","much","must","my","myself","n","name","namely","nd","near","nearly","necessary","need","needs","neither","never","nevertheless","new","next","nine","no","nobody","non","none","noone","nor","normally","not","nothing","novel","now","nowhere","o","obviously","of","off","often","oh","ok","okay","old","on","once","one","ones","only","onto","or","other","others","otherwise","ought","our","ours","ourselves","out","outside","over","overall","own","p","particular","particularly","per","perhaps","placed","please","plus","possible","presumably","probably","provides","q","que","quite","qv","r","rather","rd","re","really","reasonably","regarding","regardless","regards","relatively","respectively","right","s","said","same","saw","say","saying","says","second","secondly","see","seeing","seem","seemed","seeming","seems","seen","self","selves","sensible","sent","serious","seriously","seven","several","shall","she","should","shouldn't","since","six","so","some","somebody","somehow","someone","something","sometime","sometimes","somewhat","somewhere","soon","sorry","specified","specify","specifying","still","sub","such","sup","sure","t","t's","take","taken","tell","tends","th","than","thank","thanks","thanx","that","that's","thats","the","their","theirs","them","themselves","then","thence","there","there's","thereafter","thereby","therefore","therein","theres","thereupon","these","they","they'd","they'll","they're","they've","think","third","this","thorough","thoroughly","those","though","three","through","throughout","thru","thus","to","together","too","took","toward","towards","tried","tries","truly","try","trying","twice","two","u","un","under","unfortunately","unless","unlikely","until","unto","up","upon","us","use","used","useful","uses","using","usually","uucp","v","value","various","very","via","viz","vs","w","want","wants","was","wasn't","way","we","we'd","we'll","we're","we've","welcome","well","went","were","weren't","what","what's","whatever","when","whence","whenever","where","where's","whereafter","whereas","whereby","wherein","whereupon","wherever","whether","which","while","whither","who","who's","whoever","whole","whom","whose","why","will","willing","wish","with","within","without","won't","wonder","would","wouldn't","x","y","yes","yet","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves","z","zero"];

$(function () {

    function appendRecipe(url) {
        prom.done(function (recipes) {
            var el = $('<li></li>');

            if (recipes[url].i) {
                var imgurl = '//ichef.bbci.co.uk/food/ic/food_16x9_88/recipes/' + recipes[url].u + '_16x9.jpg';    
                    var imgstyle= ' style="background-image: url(' + imgurl + ');"';
            }
            el.append('<a rel="external" target="_blank" href="http://www.bbc.co.uk/food/recipes/' + recipes[url].u + '"><span class="resimg"' + imgstyle + '></span><span class="title">' + recipes[url].t + '</span></a>');
            if (recipes[url].v) {
                el.append(' <span class="v">&#9445;</span>');
            }
            if (recipes[url].r) {
                el.append(' <span class="recommend">&#11089;' + recipes[url].r + '</span>');
            }
            el.append('<br />');
            if (recipes[url].l) {
                el.append(recipes[url].l + ' ingredients. ');
            }
            if (recipes[url].p) {
                el.append(recipes[url].p + ' mins to make');
            }
            if (recipes[url].c) {
                var mins = ' mins';
                if (recipes[url].p) {
                    el.append(', ');
                    mins = '';
                }
                el.append(recipes[url].c + mins + ' to cook');
            }
            el.append('.');

            $(el).appendTo('#results');
        });
    }

    function addRecipes(urls) {
        $('#results').empty().append('<ol>');
        urls.forEach(appendRecipe);
        $('#results').append('</ol>'); 
    }

    function sortByRecs(a, b) {
        // Sort on recommendations
        if (a.r === b.r) {
            return 0;
        }
        return ((a.r || 0) > (b.r || 0)) ? -1 : 1;
    }

    $('form').submit(function (e) {
        e.preventDefault();
        var search = $('#search').val().toLowerCase().trim().split(' ');
        var scores = {};
        var veggie = document.getElementById('veg').checked;

        function scoreRecipe(recipe) {
            if (veggie && !recipe.v) {
                return;
            }

            var titleLower = recipe.t.toLowerCase().trim();
            var score = 0;
            search.forEach(function (searchWord) {
                if (stopwords.indexOf(searchWord) >= 0) {
                    return;
                }
                if (new RegExp('\\b' + searchWord + '\\b').test(titleLower)) {
                    score += 1;
                }
            });
            if (score) {
                scores[recipe.u] = scores[recipe.u] + score || score;
            }
        }

        prom.done(function (recipes) {

            // Collect matching titles, add to score if matches more than once, to provide some kind of relevance sort
            Object.keys(recipes).forEach(function (url) {
                scoreRecipe(recipes[url]);
            });

            // Sort by relevance 
            var matches = Object.keys(scores);
            matches = matches.sort(function (a, b) {
                if (scores[a] === scores[b]) {
                    // Both matches have same relevance to search string
                    // So sort on recommendations
                    return sortByRecs(recipes[a], recipes[b]);
                } else {
                    // Different scores; sort by that
                    if (scores[a] === scores[b]) {
                        return 0;
                    }
                    return (scores[a] > scores[b]) ? -1 : 1;
                }
            });

            matches = matches.slice(0, 20);
            if(matches.length === 0){
                var urls = Object.keys(recipes);
                var rand = recipes[urls[Math.floor(Math.random() * urls.length)]];
                $('#results').empty().append("<p>Couldn't find any recipes for that search, sorry.</p><p>How about some nice <a href='http://www.bbc.co.uk/food/recipes/" + rand.u + "' rel='external' target='_blank'>" + rand.t.toLowerCase() + "</a> instead?</p>");
            } else {
                addRecipes(matches);
            }

        });
    });

    $('#getRandy').click(function () {
        var matches = [];
        prom.done(function (recipes) {

            var imageyRecipes = Object.keys(recipes).filter(function (url) {
                //console.log(url);
                return Math.random() > 0.75 || (recipes[url] && recipes[url].i);
            });

            while (matches.length < 20) {
                matches.push(imageyRecipes[Math.floor(Math.random() * imageyRecipes.length)]);
            }
            matches = matches.sort(function (a, b) {
                return sortByRecs(recipes[a], recipes[b]);
            });
            addRecipes(matches);
        });
    });
});
