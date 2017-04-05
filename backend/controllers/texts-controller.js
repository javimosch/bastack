var controllers = require('../model/backend-controllers-manager');
var Promise = require('promise');
var sander = require('sander');
var moment = require('moment');
var S = require('string');
var btoa = require('btoa')
var _ = require('lodash');
var modelName = 'text';
var path = require('path');
require("require.async")(require);
var Logger = controllers.logs.createLogger({
    name: "API",
    category: "TEXTS"
});

module.exports = {
    setupMultilanguageTexts: setupMultilanguageTexts,
    i18nConfig: i18nConfig,
    getAllByCategory: getAllByCategory
};


function getAllByCategory(category, cb) {
    if (cb) return cb('Not available');
    return new Promise((resolve, reject) => {
        controllers.categories.get({
            code: category
        }, function(err, cat) {
            if (err) return reject(err);
            //if(!cat) return reject('Category not available ('+category+')');
            if (!cat) return resolve([]);
            controllers.texts.getAll({
                _category: cat._id,
                __select: "content code"
            }, function(err, _texts) {
                if (err) return reject(err);
                return resolve(_texts);
            });
        });
    });
}

function i18nConfig(data, cb) {
    if (!data.appName) return cb('appName required.');
    var _requirePath = path.join(process.cwd(), 'configs/config-' + data.appName);
    require.async(_requirePath, function(config) {
        if (config.i18n_config) {
            cb(null, config.i18n_config);
        }
        else {
            cb('i18n_config required inside project configuration file');
        }
    });
}

function setupMultilanguageTexts(data, cb) {
    //Grab i18n static text from app config, if any, and save to texts. i18n category required.

    if (!data.appName) return cb('appName required.');

    return controllers.categories.get({
        code: 'i18n'
    }, (err, _category) => {
        if (err) return cb(err);
        if (!_category) {
            return cb('i18n category required.');
        }
        var _requirePath = path.join(process.cwd(), 'configs/config-' + data.appName);
        require.async(_requirePath, function(config) {
            if (config.i18n) {
                var items = config.i18n;
                var left = Object.keys(config.i18n);
                saveIterator();

                function saveIterator() {
                    if (left.length == 0) {
                        cb(null, {
                            msg: "Setup complete"
                        });
                    }
                    else {
                        var code = left[0];
                        var item = items[code];
                        controllers.texts.save({
                            _category: _category._id,
                            code: code,
                            content: item,
                            descripcion: 'autogenerated i18n item',
                            __match: {
                                _category: _category._id,
                                code: code
                            }
                        }, (err, r) => {
                            if (err) return cb(err);
                            left = left.slice(1);
                            saveIterator();
                        });

                    }
                }
            }

        });
    });
}

/*
function _importAll(data, cb) {
    actions.log('IMPORT_ALL:start');
    if (!data.items) return cb('IMPORT_ALL:data.items-expected');
    var hell = cbHell(data.items.length, () => {
        actions.log('IMPORT_ALL:Success');
        return cb(null, 'Success');
    });
    data.items.forEach(txt => {
        _import(txt, hell.next);
    });
}

function _import(data, cb) {
    actions.log('IMPORT:start:'+data.code);
    var Category = ctrl('Category');
    var db = ctrl('Text');
    if (data._category) {
        Category.import(data._category, (err, _category) => {
            if (err) return cb(err);
            data._category = _category;
            data.__match=['code'];
            return db.save(data, db);
        })
    }
    else {
        data.__match=['code'];
        return db.save(data, db);
    }
}

function reportNotFound(data, cb) {
    actions.log('reportNotFound=' + JSON.stringify(data));
    if (!data.code) return cb("code required", null);
    if (!data.categoryCode) return cb("categoryCode required", null);
    if (!data.categoryRootCode) return cb("categoryRootCode required", null);


    _withCatRoot(null, null);


    function _withCatRoot(err, cat) {
        if (err) return cb(err, null);
        if (!cat) {
            return Category.save({
                code: data.categoryRootCode,
                description: "Autogenerated category"
            }, _withCatRoot, ['code']);
        }
        Category.save({
            code: data.categoryCode,
            description: "Autogenerated page section",
            _parent: cat._id
        }, function(err, category) {
            if (err) return cb(err, null);
            return _withCat(category);
        }, ['code']);
    }

    function _withCat(category) {
        //si ya existe y fue updatedByHuman, no lo guarda.
        Text.get({
            code: data.code
        }, function(err, text) {
            if (err) return cb(err, null);
            if (text) {
                if (text.updatedByHuman && text.updatedByHuman == true) {
                    return cb(null, true); //nothing happens
                }
                else {
                    _update(category, text._id);
                }
            }
            else {
                _update(category);
            }
        })

    }

    function _update(category, textId) {
        var payload = {
            _category: category._id,
            code: data.code,
            description: 'Autogenerated',
            content: data.content || data.code
        };
        if (textId) payload._id = textId;
        Text.save(payload, function(err, text) {
            if (err) return cb(err, null);
            return cb(null, true); //created
        }, ['code']);
    }
}
*/
