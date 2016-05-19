# auntiesrecipes
A searchable archive of BBC Food Recipes.

Homepage: https://www.auntiesrecipes.co.uk

Features I would like help with:

* Write a scraper for other recipe sites ;)
* Paginated / infinite-scrollable results
* Download all the images and add them to the repo so I don't have to hotlink them
* Better isVegetarian detection in the scraper
* Search option based on prep/cooking/total time

## Scraping tool

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

