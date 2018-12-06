'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var rxjs = require('rxjs');
var operators = require('rxjs/operators');
var jsonLocalSessionStorage = require('json-local-session-storage');
var ramda = require('ramda');
var objList = require('obj-list');
var splitTrim = require('split-trim');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var re = /^([A-Za-z0-9.])+(\[.+?\])*([A-Za-z0-9.]*)*(\s*:(just|not)\s*\([A-Za-z0-9,.\s]+\))*(\s*--\s*[A-Za-z0-9]+)*$/m;
/**
 * Gets data from an object determined by a path and
 * optionally filters the result.
 *
 * @param {Array} storePath  The object path to retrieve
 * @param {Array} just       The values to keep
 * @param {Array} not        The values to exclude
 * @param {Object} data      The data to retrieve the path from
 *                           otherwise this._data is used
 * @returns {Mixed}
 */

function getDataFromPath(_ref) {
  var name = _ref.name,
      propName = _ref.propName,
      storePath = _ref.storePath,
      just = _ref.just,
      not = _ref.not,
      _ref$data = _ref.data,
      data = _ref$data === void 0 ? {} : _ref$data;
  var result = storePath.reduce(function (acc, path) {
    if (objList.isObject(path)) {
      acc = objList.objList.get(acc, path.key, path.value);
      return acc;
    }

    acc = acc ? acc[path] : null;
    return acc;
  }, data);

  if (!result) {
    return pathResults(name, propName, result);
  }

  if (just) {
    return pathResults(name, propName, just.reduce(function (acc, value) {
      if (value.match(/\./)) {
        var parts = splitTrim.splitTrim(value, '.');
        acc[parts[parts.length - 1]] = ramda.path(parts, result);
        return acc;
      }

      acc[value] = ramda.pick([value], result)[value];
      return acc;
    }, {}));
  } else if (not) {
    return pathResults(name, propName, ramda.omit(not, result));
  }

  return pathResults(name, propName, result);
}

var pathResults = function pathResults(name, propName, result) {
  return name && !propName ? _defineProperty({}, name, result) : result;
};
/**
 * Splits the filter from the path
 *
 * @param {String} str
 * @returns {Object}
 */


function parseFilter(str) {
  // a.b.c:just(d, e) -> a.b.c  (d, e)
  var _splitTrim = splitTrim.splitTrim(str, ':just'),
      _splitTrim2 = _slicedToArray(_splitTrim, 2),
      path = _splitTrim2[0],
      just = _splitTrim2[1];

  if (!just) {
    // a.b.c:not(d, e) -> a.b.c  (d, e)
    var _splitTrim3 = splitTrim.splitTrim(str, ':not'),
        _splitTrim4 = _slicedToArray(_splitTrim3, 2),
        _path = _splitTrim4[0],
        not = _splitTrim4[1];

    if (not) {
      // (d, e) -> ['d', 'e']
      not = splitTrim.splitTrim(not.replace(/[()]/g, ''), ',');
      return {
        path: _path,
        not: not
      };
    } else {
      return {
        path: _path
      };
    }
  } else {
    // (d, e) -> ['d', 'e']
    just = splitTrim.splitTrim(just.replace(/[()]/g, ''), ',');
  }

  return {
    path: path,
    just: just
  };
}
/**
 * Splits the store name from the path
 *
 * @param {String} str
 * @returns {Object}
 */


function parsePath(str) {
  if (!str.match(/\./)) {
    return {
      store: str,
      storePath: []
    };
  }

  var paths = splitTrim.splitTrim(str, '.');
  var store = paths.shift().trim();
  var storePath = paths.reduce(function (acc, path) {
    // [id: 123] -> {key: 'id', value: 123}
    // [id: 123, name: 'aaa'] -> [{key: 'id', value: 123}, {key: 'name', value: 'aaa}]
    if (path.match(/[[:]/)) {
      var parts = splitTrim.splitTrim(path.replace(/\[\]/, ''), ':');
      acc.push({
        key: parts[0].replace('[', '').trim(),
        value: parts[1].replace(']', '').trim()
      });
    } else {
      acc.push(path);
    }

    return acc;
  }, []);
  return {
    store: store,
    storePath: storePath
  };
}

function parse(str) {
  str = splitTrim.splitTrim(str, '\n').join('');
  var stores = splitTrim.splitTrim(str, '|');
  var numStores = stores.length;

  if (!stores || !stores.length) {
    throw new Error('Trying to parse a store path that is badly formed:\n\n' + str + '\n');
  }

  var data = stores.reduce(function (acc, str) {
    acc.push(parseString(str, numStores));
    return acc;
  }, []);
  return data.length === 1 ? data[0] : data;
}
/**
 * Calls the above functions in sequence and
 * bundles the results
 *
 * @param {String} str
 * @returns {Object}
 */


function parseString(str, numStores) {
  if (!re.test(str)) {
    throw new Error('Trying to parse a store path that is badly formed:\n\n' + str + '\n');
  }

  var propName;

  var _splitTrim5 = splitTrim.splitTrim(str, '--'),
      _splitTrim6 = _slicedToArray(_splitTrim5, 2),
      paths = _splitTrim6[0],
      name = _splitTrim6[1];

  var _parseFilter = parseFilter(paths),
      path = _parseFilter.path,
      just = _parseFilter.just,
      not = _parseFilter.not;

  var _parsePath = parsePath(path),
      store = _parsePath.store,
      storePath = _parsePath.storePath;

  if (just && just.length === 1) {
    storePath.push(just[0]);
    just = void 0;
  }

  if (storePath.length && !objList.isObject(storePath[storePath.length - 1])) {
    propName = storePath[storePath.length - 1];
  }

  if (numStores > 1 && !name) {
    if (propName) {
      name = propName;
    } else if (storePath.length) {
      throw new Error('Trying to parse a multi-store path where one of the paths needs a name such as :\n\n' + str + ' -- someName\n');
    } else {
      name = store;
    }
  } else if (!name && propName) {
    name = propName;
  }

  return {
    name: name,
    store: store,
    propName: propName,
    storePath: storePath,
    just: just,
    not: not
  };
}

/**
 * Debug mode
 */

var DEBUG = false;
/**
 * Use local session storage to store all stores on update
 * and to load from on registration
 */

var USE_SESSION = false;
/**
 * Container for all created store instances
 */

var stores = {};
/**
 * Empty function for use as a no operation
 */

var noop = function noop() {};
/**
 * Symbols for function names to keep class functions
 * from being overloaded
 */


var DATA = Symbol('data');
var UPDATED = Symbol('updated');
var NOT_UPDATED = Symbol('not-updated');
var UPDATE_DATA = Symbol('updateData');
var DEBUG_FN = Symbol('debug');
var SUBSCRIBE_TO_PROPERTY = Symbol('subscribeToProperty');
/**
 * Class for a single store
 */

var _Store =
/*#__PURE__*/
function () {
  function _Store(name, data, options) {
    _classCallCheck(this, _Store);

    this.name = name;
    this[DATA] = new WeakMap();
    var storedData = options.session && jsonLocalSessionStorage.session.getItem(name);
    this[DATA].set(this, storedData || data);
    this.props = [];
    this.data$ = new rxjs.BehaviorSubject(this.data);
    this.onSubscribeCallback = options.fetchData || noop;
    this.debugTimer = null;
    this.useLocalSession = options.session;

    if (!stores[name]) {
      stores[name] = this;
    } else {
      throw new Error("Trying to create a store with a name that's already in use");
    }
  }
  /**
   * Returns a copy of the store data
   */


  _createClass(_Store, [{
    key: "setOnSubscribeCallback",

    /**
     * Called whenever something subscribes to this store
     * The default is a noop
     * The main purpose is for lazy loading the store with data
     * fetched from a server. By doing this once in this callback
     * then a store only has to fetch it's initial data if and when
     * it gets a subscription.
     *
     * @param {Function} callback
     */
    value: function setOnSubscribeCallback(callback) {
      this.onSubscribeCallback = callback;
    }
    /**
     * Use local session storage for this store instance
     */

  }, {
    key: "useSession",
    value: function useSession() {
      this.useLocalSession = true;
    }
    /**
     * Provides a subscription to the store state changes
     *
     * @param {Function} callback
     * @param {Array} storePath
     * @param {Array} just
     * @param {Array} not
     * @returns {Subscription}
     */

  }, {
    key: "subscribe",
    value: function subscribe(_ref) {
      var callback = _ref.callback,
          storePath = _ref.storePath,
          just = _ref.just,
          not = _ref.not,
          filter = _ref.filter;
      storePath = storePath || [];
      this.onSubscribeCallback();
      return this[SUBSCRIBE_TO_PROPERTY](function (data) {
        return getDataFromPath({
          storePath: storePath,
          just: just,
          not: not,
          data: data
        });
      }, callback, filter);
    }
    /**
     * Subscribes to only a part of the store
     * This filters and checks the part the subscription is interested in
     * to prevent updates to other parts of the store but not this part
     * being broadcast
     *
     * @param {Function} getProperty A function to retrieve the desired
     *                             property of the store to subscribe to
     * @param {Function} callback  If there are changes this function is
     *                             called with them
     * @returns {Subscription}
     */

  }, {
    key: SUBSCRIBE_TO_PROPERTY,
    value: function value(getProperty, callback, propFilter) {
      var _this = this;

      var currentProperty = getProperty(this._data);
      return this.data$.pipe(operators.startWith(this._data), operators.map(function (updatedData) {
        if (_this.silent) {
          currentProperty = getProperty(updatedData);
          return currentProperty;
        } else {
          return getProperty(updatedData);
        }
      }), operators.filter(function (updatedProperty) {
        return !_this.silent && !ramda.equals(currentProperty, updatedProperty);
      }), operators.map(function (updatedProperty) {
        currentProperty = updatedProperty;
        return currentProperty;
      }), operators.filter(function (prop) {
        if (propFilter) {
          return prop[propFilter.key] !== propFilter.value;
        }

        return true;
      }), operators.debounceTime(100)).subscribe(callback);
    }
    /**
     * Updates the state of the store and broadcasts it
     * to subscribers
     * A silent update does not broadcast the update
     *
     * @param {Object}  data
     * @param {Boolean} silent
     */

  }, {
    key: "update",
    value: function update(data) {
      var silent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (ramda.equals(this._data, data)) {
        this[DEBUG_FN](NOT_UPDATED, data);
      } else {
        var updatedData = this[UPDATE_DATA](data);
        this[DEBUG_FN](UPDATED, data, updatedData);
        this[DATA].set(this, updatedData);
        updatedData = null;
        this.silent = silent;
        this.data$.next(this._data);

        if (USE_SESSION || this.useLocalSession) {
          jsonLocalSessionStorage.session.setItem(this.name, this.data);
        }
      }
    }
    /**
     * Shorthand method for calling update with silent
     * set to true
     *
     * @param {Object} data
     */

  }, {
    key: "silentUpdate",
    value: function silentUpdate(data) {
      this.update(data, true);
    }
    /**
     * Returns an updated version of the current store data
     * after applying the supplied updates
     *
     * @param {Object} data
     */

  }, {
    key: UPDATE_DATA,
    value: function value(data) {
      if (objList.isObject(data)) {
        return _objectSpread({}, this._data, data);
      } else {
        return data;
      }
    }
    /**
     * A debug function for tracking store state updates
     * in the console
     * Call Store.debug(true) in the root of an app to
     * set up debugging
     */

  }, {
    key: DEBUG_FN,
    value: function value(action, data, updatedData) {
      var _this2 = this;

      var dataCopy = ramda.clone(this._data);
      clearTimeout(this.debugTimer);
      this.debugTimer = setTimeout(function () {
        if (DEBUG) {
          switch (action) {
            case UPDATED:
              console.log.green(_this2.name, dataCopy, updatedData);
              break;

            case NOT_UPDATED:
              console.log.yellow("Store skipped update: ".concat(_this2.name), dataCopy, data);
              break;

            default:
              return void 0;
          }
        }
      }, 1000);
    }
  }, {
    key: "data",
    get: function get() {
      return ramda.clone(this._data);
    }
    /**
     * Shorthand method for retrieving the whole store
     * data structure
     */

  }, {
    key: "_data",
    get: function get() {
      return this[DATA].get(this);
    }
  }]);

  return _Store;
}();

var getData = function getData(path) {
  var data = parse(path);
  return getDataFromPath(_objectSpread({}, data, {
    data: Store(data.store).data
  }));
}; // Exports


function Store(name) {
  if (stores[name]) {
    return stores[name];
  }

  throw new Error('Failed to access the store with the name: ' + name);
}
function Data(path) {
  var data = getData(path);

  if (data === null || data === undefined) {
    throw new Error('Failed to access the store with the name: ' + path);
  }

  return data;
}
var registerStore = function registerStore(name, defaultData) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return new _Store(name, defaultData, options);
};
var setStoreDebugging = function setStoreDebugging(toDebugOrNotToDebug) {
  DEBUG = toDebugOrNotToDebug;
};
var setStoreSession = function setStoreSession(session) {
  USE_SESSION = session;
};

exports.Store = Store;
exports.Data = Data;
exports.registerStore = registerStore;
exports.setStoreDebugging = setStoreDebugging;
exports.setStoreSession = setStoreSession;
