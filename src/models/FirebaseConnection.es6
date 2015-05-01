'use strict'

import BaseDBConnection from './BaseDBConnection';
// import app from '../Angular';

const chalk =           require('chalk'),
      Firebase =        require('firebase'),
      FirebaseTokenGenerator = require("firebase-token-generator.js"),
      // mysql =           require('mysql'),
      // mkdirp =          require('mkdirp'),
      // fs =              require('fs');

const p = process;

export default class FirebaseConnection extends BaseDBConnection {
    constructor(database = 'default') {
        super();
        if (checkConfig(this.config.databases[database])) {
            console.log(chalk.bold(chalk.red('ANGIE [Error]: wut?')));
            p.exit(1);
        } else {
            this.db = new Firebase(this.config.databases[database].url);
        }

    }
    read(model) {
        this.db.child(model.name).on('value', function(data) {
            return data;
        });
    }
    create(model) {
        let data = this.read(model);

        // TODO can you set a specific instance of a model?

        //data[data.length] = {};
        //this.db.set(data[data.length], {})
    }
    syncdb() {
        super.syncdb();

        // You do not have to do much to syncdb here
        // TODO add empty fields fore records added
    }
}

checkConfig(db) {
    return !db.url;
}

// TODO security around this connection


// Firebase is a little different
    // The data is basically just kvps
    // We need to create one big list per model