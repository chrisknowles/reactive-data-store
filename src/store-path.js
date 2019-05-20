import {pick, omit, path, propSatisfies, find} from 'ramda';
import {objList, isObject} from 'obj-list';
import {splitTrim} from 'split-trim';

const re = /^([A-Za-z0-9.])+(\[.+?\])*([A-Za-z0-9.]*)*(\s*:(just|not)\s*\([A-Za-z0-9_:,.\s]+\))*(\s*--\s*[A-Za-z0-9]+)*$/m;
// const re = /^.*$/;

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
function getDataFromPath({name, propName, storePath, just, not, data = {}}) {
  let result = storePath.reduce((acc, path) => {
    if (isObject(path)) {
      acc = objList.get(acc, {[path.key]: path.value});
      return acc;
    }
    acc = acc ? acc[path] : null;
    return acc;
  }, data);
  if (!result) {
    return pathResults(name, propName, result);
  }
  if (just) {
    return pathResults(name, propName, just.reduce((acc, value) => {
      if (value.match(/\./)) {
        const parts = splitTrim(value, '.');
        acc[parts[parts.length - 1]] = path(parts, result);
        return acc;
      }
      acc[value] = pick([value], result)[value];
      return acc;
    }, {}));
  } else if (not) {
    const props = [];
    const keyVals = [];
    not.map(str => {
      if (/:/.test(str)) {
        keyVals.push(str);
      } else {
        props.push(str);
      }
    });
    if (props) {
      if (Array.isArray(result)) {
        result = result.map(item => pathResults(name, propName, omit(props, item)));
      } else {
        result = pathResults(name, propName, omit(props, result));
      }
    }
    if (keyVals) {
      keyVals.map(pair => {
        pair = splitTrim(pair, ':');
        result = result.filter(item => item[pair[0]] !== pair[1]);
      });
    }
    return result;
  }
  return pathResults(name, propName, result);
}

const pathResults = (name, propName, result) =>
  name && !propName
    ? {[name]: result}
    : result;

/**
 * Splits the filter from the path
 *
 * @param {String} str
 * @returns {Object}
 */
function parseFilter(str) {
  // a.b.c:just(d, e) -> a.b.c  (d, e)
  let [path, just] = splitTrim(str, ':just');
  if (!just) {
    // a.b.c:not(d, e) -> a.b.c  (d, e)
    let [path, not] = splitTrim(str, ':not');
    if (not) {
      // (d, e) -> ['d', 'e']
      not = splitTrim(not.replace(/[()]/g, ''), ',');
      return {path, not};
    } else {
      return {path};
    }
  } else {
    // (d, e) -> ['d', 'e']
    just = splitTrim(just.replace(/[()]/g, ''), ',');
  }
  return {path, just};
}

/**
 * Splits the store name from the path
 *
 * @param {String} str
 * @returns {Object}
 */
function parsePath(str) {
  if (!str.match(/\./)) {
    return {store: str, storePath: []};
  }
  const paths = splitTrim(str, '.');
  const store = paths.shift().trim();
  const storePath = paths.reduce((acc, path) => {
    // [id: 123] -> {key: 'id', value: 123}
    // [id: 123, name: 'aaa'] -> [{key: 'id', value: 123}, {key: 'name', value: 'aaa}]
    if (path.match(/[[:]/)) {
      const parts = splitTrim(path.replace(/\[\]/, ''), ':');
      acc.push({key: parts[0].replace('[', '').trim(), value: parts[1].replace(']', '').trim()});
    } else {
      acc.push(path);
    }
    return acc;
  }, []);
  return {store, storePath};
}

function parse(str) {
  str = splitTrim(str, '\n').join('');
  const stores = splitTrim(str, '|');
  const numStores = stores.length;
  if (!stores || !stores.length) {
    throw new Error('Trying to parse a store path that is badly formed:\n\n' + str + '\n');
  }
  const data = stores.reduce((acc, str) => {
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
  let propName;
  let [paths, name] = splitTrim(str, '--');
  let {path, just, not} = parseFilter(paths);
  const {store, storePath} = parsePath(path);
  if (just && just.length === 1) {
    storePath.push(just[0]);
    just = void 0;
  }
  if (storePath.length && !isObject(storePath[storePath.length - 1])) {
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
  return {name, store, propName, storePath, just, not};
}

export{getDataFromPath, parse};
