# auntiesrecipes
A searchable archive of BBC Food Recipes.

Homepage: https://www.auntiesrecipes.co.uk

Features I would like help with:

* Write a scraper for other recipe sites ;)
* Paginated / infinite-scrollable results
* Download all the images and add them to the repo so I don't have to hotlink them
* Better isVegetarian detection in the scraper
* Search option based on prep/cooking/total time

## Download tool

The download can be done through a shell script and `wget` or through a Node.js download app.

* Sitemap.xml is pulled (this file is huge and contains each recipe)
* Each HTML file is pulled at a rate of 3-10 at a time depending on config

### Installation

```
$ npm install
```

### Running the tool

Note: this will take a long time and creates over 1GB of stored text.

```
$ node index.js
```

## Scraping tool

First run the download tool to gather all the HTML files from the BBC website.

### Installation

Use `npm` to install dependencies such as Cheerio.

```
$ cd scraper
$ npm install
```

### Running the scrape

```
$ cd scraper
$ node scrape.js
```

Optional: environmental variable RECIPE_DIR can be set. 

