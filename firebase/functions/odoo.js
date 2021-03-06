'use strict';

var assert = require('assert');

var jayson = require('jayson'),
    _ = require('lodash');

var http; // set on connect depending on the option given by the user

var Odoo = function (config) {
    config = config || {};

    this.host = config.host;
    this.port = config.port || 80;
    this.database = config.database;
    this.username = config.username;
    this.password = config.password;
    this.protocol = config.protocol || "http"
};

// Connect
Odoo.prototype.connect = function (cb) {
    var params = {
        db: this.database,
        login: this.username,
        password: this.password
    };

    var json = JSON.stringify({
        params: params
    });

    var options = {
        host: this.host,
        port: this.port,
        path: '/web/session/authenticate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': json.length
        }
    };

    var self = this;

    http = require(this.protocol)
    const promise = new Promise((resolve, reject) => {
        var req = http.request(options, function (res) {
            var response = '';

            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                response += chunk;
            });

            res.on('end', function () {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    if (cb) {
                        cb(e, null);
                    }
                    reject(e);
                    return;
                }

                if (response.error) {
                    if (cb) {
                        cb(response.error, null);
                    }
                    reject(response.error);
                    return;
                }

                self.uid = response.result.uid;
                self.sid = res.headers['set-cookie'][0].split(';')[0];
                self.session_id = response.result.session_id;
                self.context = response.result.user_context;
                if (cb) {
                    cb(null, response.result);
                }
                resolve(response.result);
                return;
            });
        });
        req.write(json);
    });
    return promise;
};

// Search records
Odoo.prototype.search = function (model, params, callback) {
    // assert(params.ids, "Must provide a list of IDs.");
    assert(params.domain, "Must provide a search domain.");

    return this._request('/web/dataset/call_kw', {
        kwargs: {
            context: this.context
        },
        model: model,
        method: 'search',
        args: [
            params.domain,
        ],
    }, callback);
};

// Search & Read records
// https://www.odoo.com/documentation/8.0/api_integration.html#search-and-read
// https://www.odoo.com/documentation/8.0/reference/orm.html#openerp.models.Model.search
// https://www.odoo.com/documentation/8.0/reference/orm.html#openerp.models.Model.read
Odoo.prototype.search_read = function (model, params, callback) {
    assert(params.domain, "'domain' parameter required. Must provide a search domain.");
    assert(params.limit, "'limit' parameter required. Must specify max. number of results to return.");

    return this._request('/web/dataset/call_kw', {
        model: model,
        method: 'search_read',
        args: [],
        kwargs: {
            context: this.context,
            domain: params.domain,
            offset: params.offset,
            limit: params.limit,
            order: params.order,
            fields: params.fields,
        },
    }, callback);
};

// Get record
// https://www.odoo.com/documentation/8.0/api_integration.html#read-records
// https://www.odoo.com/documentation/8.0/reference/orm.html#openerp.models.Model.read
Odoo.prototype.get = function (model, params, callback) {
    assert(params.ids, "Must provide a list of IDs.");

    return this._request('/web/dataset/call_kw', {
        model: model,
        method: 'read',
        args: [
            params.ids,
        ],
        kwargs: {
            fields: params.fields,
        },
    }, callback);
}; //get


// Browse records by ID
// Not a direct implementation of Odoo RPC 'browse' but rather a workaround based on 'search_read'
// https://www.odoo.com/documentation/8.0/reference/orm.html#openerp.models.Model.browse
Odoo.prototype.browse_by_id = function (model, params, callback) {
    params.domain = [
        ['id', '>', '0']
    ]; // assumes all records IDs are > 0
    return this.search_read(model, params, callback);
}; //browse


// Create record
Odoo.prototype.create = function (model, params, callback) {
    return this._request('/web/dataset/call_kw', {
        kwargs: {
            context: this.context
        },
        model: model,
        method: 'create',
        args: [params]
    }, callback);
};

// Update record
Odoo.prototype.update = function (model, id, params, callback) {
    assert(id, "Must provide an id");
    return this._request('/web/dataset/call_kw', {
        kwargs: {
            context: this.context
        },
        model: model,
        method: 'write',
        args: [
            [id], params
        ]
    }, callback);
};

// Delete record
Odoo.prototype.delete = function (model, id, callback) {
    return this._request('/web/dataset/call_kw', {
        kwargs: {
            context: this.context
        },
        model: model,
        method: 'unlink',
        args: [
            [id]
        ]
    }, callback);
};


// Generic RPC wrapper
// DOES NOT AUTO-INCLUDE context
Odoo.prototype.rpc_call = function (endpoint, params, callback) {
    assert(params.model);
    // assert(params.method);
    // assert(params.args);
    // assert(params.kwargs);
    // assert(params.kwargs.context);

    return this._request(endpoint, params, callback);
}; //generic


// Private functions
Odoo.prototype._request = function (path, params, callback) {
    params = params || {};
    //console.log('RPC:', params);
    var options = {
        host: this.host,
        port: this.port,
        path: path || '/',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': this.sid + ';'
        }
    };

    var client = jayson.client[this.protocol](options);

    const promise = new Promise((resolve, reject) => {
        client.request('call', params, function (e, err, res) {
            if (e || err) {
                reject(e || err);
                if (callback) {
                    callback(e || err, null);
                }
                return;
            }
            resolve(res);
            if (callback) {
                callback(null, res);
            }
            return;
        });
    });

    return promise;
};

module.exports = Odoo;