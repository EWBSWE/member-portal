# About
This is the repository for the backend and web frontend for the member registration system for Engineers without Borders in Sweden.

# Dependencies
* Postgres
* Ruby + sass

# Setting up
* Clone project
* Copy file `server/src/env.sample` to `./env` and fill in the placeholders
* Run `npm install`
* Run `npx bower install`
* Build frontend with `npm run watch:build`
* Start the backend with `npm start`

# Deploying
Any changes pushed to `master` will build and deploy. Environment variables are currently not included in the build process but stored on the remote server. In case of additions or changes to API keys the remote server has to be updated manually.

# History
Started out as a project generated with Yeoman.

