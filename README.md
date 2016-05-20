# Disney Dining Scout Server
This is the API/UI server for the Disney Dining Scout application

It is built with the following technologies
* NodeJS
* ExpressJS
* Sequelize
* MomentJS
* MariaDB
* Backbone
* Underscore
* Marionette

## Deployment

### Dependencies
* node.js (Ubuntu 16.04: `apt-get install nodejs-legacy`)
* npm

### Install

```bash
git clone https://github.com/mattvoss/disney-dining-server.git
cd disney-dining-server
npm install
sudo npm install -g sequelize-cli bower grunt-cli
bower install
```
Then copy and edit the config/settings.json.dist and the config/config.json.dist with the pertinent database configurations and application settings.

```bash
sequelize db:migrate
npm start
```
