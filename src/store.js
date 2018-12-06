import {BehaviorSubject} from 'rxjs';
import {startWith, filter, map, debounceTime} from 'rxjs/operators';
import {equals, clone} from 'ramda';
import {session} from 'json-local-session-storage';
import {isObject} from 'obj-list';
import {parse, getDataFromPath} from './store-path';

/**
 * Debug mode
 */
let DEBUG = false;

/**
 * Use local session storage to store all stores on update
 * and to load from on registration
 */
let USE_SESSION = false;

/**
 * Container for all created store instances
 */
const stores = {};

/**
 * Empty function for use as a no operation
 */
const noop = () => {};

/**
 * Symbols for function names to keep class functions
 * from being overloaded
 */
const DATA = Symbol('data');
const UPDATED = Symbol('updated');
const NOT_UPDATED = Symbol('not-updated');
const UPDATE_DATA = Symbol('updateData');
const DEBUG_FN = Symbol('debug');
const SUBSCRIBE_TO_PROPERTY = Symbol('subscribeToProperty');

/**
 * Class for a single store
 */
class _Store {

  constructor(name, data, options) {
    this.name = name;
    this[DATA] = new WeakMap();
    const storedData = options.session && session.getItem(name);
    this[DATA].set(this, storedData || data);
    this.props = [];
    this.data$ = new BehaviorSubject(this.data);
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
  get data() {
    return clone(this._data);
  }

  /**
   * Shorthand method for retrieving the whole store
   * data structure
   */
  get _data() {
    return this[DATA].get(this);
  }

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
  setOnSubscribeCallback(callback) {
    this.onSubscribeCallback = callback;
  }

  /**
   * Use local session storage for this store instance
   */
  useSession() {
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
  subscribe({callback, storePath, just, not, filter}) {
    storePath = storePath || [];
    this.onSubscribeCallback();
    return this[SUBSCRIBE_TO_PROPERTY](
      data => getDataFromPath({storePath, just, not, data}),
      callback,
      filter
    );
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
  [SUBSCRIBE_TO_PROPERTY](getProperty, callback, propFilter) {
    let currentProperty = getProperty(this._data);
    return this.data$
      .pipe(
        startWith(this._data),
        map(updatedData => {
          if (this.silent) {
            currentProperty = getProperty(updatedData);
            return currentProperty;
          } else {
            return getProperty(updatedData);
          }
        }),
        filter(updatedProperty =>
          !this.silent && !equals(currentProperty, updatedProperty)),
        map(updatedProperty => {
          currentProperty = updatedProperty;
          return currentProperty;
        }),
        filter(prop => {
          if (propFilter) {
            return prop[propFilter.key] !== propFilter.value;
          }
          return true;
        }),
        debounceTime(100)
      )
      .subscribe(callback);
  }

  /**
   * Updates the state of the store and broadcasts it
   * to subscribers
   * A silent update does not broadcast the update
   *
   * @param {Object}  data
   * @param {Boolean} silent
   */
  update(data, silent = false) {
    if (equals(this._data, data)) {
      this[DEBUG_FN](NOT_UPDATED, data);
    } else {
      let updatedData = this[UPDATE_DATA](data);
      this[DEBUG_FN](UPDATED, data, updatedData);
      this[DATA].set(this, updatedData);
      updatedData = null;
      this.silent = silent;
      this.data$.next(this._data);
      if (USE_SESSION || this.useLocalSession) {
        session.setItem(this.name, this.data);
      }
    }
  }

  /**
   * Shorthand method for calling update with silent
   * set to true
   *
   * @param {Object} data
   */
  silentUpdate(data) {
    this.update(data, true);
  }

  /**
   * Returns an updated version of the current store data
   * after applying the supplied updates
   *
   * @param {Object} data
   */
  [UPDATE_DATA](data) {
    if (isObject(data)) {
      return {...this._data, ...data};
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
  [DEBUG_FN](action, data, updatedData) {
    const dataCopy = clone(this._data);
    clearTimeout(this.debugTimer);
    this.debugTimer = setTimeout(() => {
      if (DEBUG) {
        switch (action) {
          case UPDATED:
            console.log.green(this.name, dataCopy, updatedData);
            break;
          case NOT_UPDATED:
            console.log.yellow(`Store skipped update: ${this.name}`, dataCopy, data);
            break;
          default:
            return void 0;
        }
      }
    }, 1000);
  }

}

const getData = path => {
  const data = parse(path);
  return getDataFromPath({...data,  ...{data: Store(data.store).data}});
};

// Exports

export function Store(name) {
  if (stores[name]) {
    return stores[name];
  }
  throw new Error('Failed to access the store with the name: ' + name);
}

export function Data(path) {
  const data = getData(path);
  if (data === null || data === undefined) {
    throw new Error('Failed to access the store with the name: ' + path);
  }
  return data;
}

export const registerStore = (name, defaultData, options = {}) =>
  new _Store(name, defaultData, options);

export const setStoreDebugging = toDebugOrNotToDebug => {
  DEBUG = toDebugOrNotToDebug;
};

export const setStoreSession = session => {
  USE_SESSION = session;
};
