# About
This is the repository for the backend and web frontend for the member registration system for Engineers without Borders in Sweden.

# Dependencies
* Postgres
* Ruby + sass

# Setting up
* Clone project
* Copy file `server/env.sample` to `server/.env` and fill in the placeholders
* Update `server/config/environment/index.js` with your database info
    * NOTE: The dev database is hardcoded at the moment and will change to pick up local settings in the future.
* Run `npm install`
* Run `npx bower install`
* Start the backend with `npm start`
* Watch frontend changes with `npx grunt serve`

# Deploying
Any changes pushed to `master` will build and deploy. Environment variables are currently not included in the build process but stored on the remote server. In case of additions or changes to API keys the remote server has to be updated manually.

# History
Started out as a project generated with Yeoman.

