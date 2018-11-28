# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

Restaurant reviews home page displays a list of restaurants which can be filtered by neighborhood & cuisine. 'View Details' button takes us to see the detailed information of that restaurant.

Restaurant info page shows the location of restaurant on map, its hours & reviews by users.
This page also has a 'Write review' button which users can use to share their experience. 

### What do I do from here?

1. This project uses a [Data server](https://github.com/virajlad/mws-restaurant-stage-3). Follow the instructions in the README for that repository to get the data server running. 

2. Clone the [Web server](https://github.com/virajlad/mws-restaurant-stage-1). In this folder, run `npm install` to install node module dependencies.

3. Run `gulp` to apply other required transforms. e.g. it will generate resized images for responsive webpages, apply CSS & JS transforms.

4. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

5. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.

## Leaflet.js and Mapbox:

This repository uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/). You need to replace `<your MAPBOX API KEY HERE>` with a token from [Mapbox](https://www.mapbox.com/). Mapbox is free to use, and does not require any payment information. 

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write. 



