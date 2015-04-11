# About #

This is the repository for the back-end and web front-end for the member registration system for Engineers without Borders in Sweden.

# Project Structure #

See the Project Structure section from the yeoman generator page for more on how the project is structured: https://www.npmjs.org/package/generator-angular-fullstack: https://www.npmjs.com/package/generator-angular-fullstack#project-structure

## Building ##

Developers can build the repository using npm, bower, grunt, ruby and MongoDB. See Installing dependencies for more.

Other project dependencies are installed or updated through NPM and Bower as shown below:

```bash
# On first install
npm install
bower install

# When updating
npm update
bower update

#removing unused packages
npm prune
bower prune
```

# Installing dependencies
## Installing MongoDB ##
### Mac OS X ###
```bash
brew install mongodb
sudo mkdir -p /data/db
sudo chmod -R 777 /data/db
mongod  --storageEngine wiredTiger
```
## Installing Ruby ##
For Unix systems that can handle bash and curl there's RVM.

## Installing Node ##
You can download it directly from the homepage: https://nodejs.org/

Or use a package manager like brew for Mac OS X.

### Mac OS X ###
There's brew: 
```
brew install node
```
Might require follow-up steps using "sudo"

## Installing Bower ##
(be careful to use sudo if necessary)
```bash
npm install -g bower
```

## Installing Grunt ##
(be careful to use sudo if necessary)
```bash
npm install -g grunt-cli
```

# Building and Running #
## Database ##
When running database on Unix systems the following command can be used to start the database in a console window:
```bash
mongod  --storageEngine wiredTiger
```
Note that you can also run it with a config file option with more configurations inside the config file. The important 
part here is to be consistent with which storage engine is used. As once the database files have been started they can 
only use the storage engine that it was started with. Migration can be done by dumping the database and restoring it 
with another storage engine or simply deleting the database folder and using another storage engine.

## Environment ##
When launching it in development ensure the environment is set to development with the following:

```bash
export NODE_ENV=development
```

To launch it in production enter the following: 

```bash
export NODE_ENV=production
```

## Grunt ##
Launch the express server in development mode by running (this command assumes that the node environment variable is already set to development)

```bash
grunt serve
```

Launch the server in debug-brk mode with a node-inspector tab
by running

```bash
grunt serve:debug
```

Launch it in production mode (make it use the minified
production folder) by running

```bash
grunt serve:dist
```

Generate a dist-folder that can easily be deployed by running (this command assumes that the node environment variable is already set to production mode):

```bash
grunt
```

# Testing
`grunt test` will run both server and client tests. You can also run
`grunt test:server` and `grunt test:client`.