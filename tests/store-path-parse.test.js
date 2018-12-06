import test from 'tape';
import {parse} from '../src/store-path.js';

const examples = {
  good: [
    ['App', {
      name: undefined,
      store: 'App',
      propName: undefined,
      storePath: [],
      just: undefined,
      not: undefined,
    }],
    ['App -- app', {
      name: 'app',
      store: 'App',
      propName: undefined,
      storePath: [],
      just: undefined,
      not: undefined,
    }],
    ['App.config.session', {
      name: 'session',
      propName: 'session',
      store: 'App',
      storePath: ['config', 'session'],
      just: undefined,
      not: undefined,
    }],
    ['App.config.session -- appSession', {
      name: 'appSession',
      store: 'App',
      propName: 'session',
      storePath: ['config', 'session'],
      just: undefined,
      not: undefined,
    }],
    ['App.errorMessages.[id:2].text', {
      name: 'text',
      store: 'App',
      propName: 'text',
      storePath: ['errorMessages', {key: 'id', value: '2'}, 'text'],
      just: undefined,
      not: undefined,
    }],
    ['App.errorMessages.[id:2]:just(text)', {
      name: 'text',
      store: 'App',
      propName: 'text',
      storePath: ['errorMessages', {key: 'id', value: '2'}, 'text'],
      just: undefined,
      not: undefined,
    }],
    ['App.errorMessages.[id:2]', {
      name:undefined,
      store: 'App',
      propName: undefined,
      storePath: ['errorMessages', {key: 'id', value: '2'}],
      just: undefined,
      not: undefined,
    }],
    ['App.errorMessages.[id:2]:just(text, code) -- errorMessage', {
      name: 'errorMessage',
      store: 'App',
      propName: undefined,
      storePath: ['errorMessages', {key: 'id', value: '2'}],
      just: ['text', 'code'],
      not: undefined,
    }],
    ['App.errorMessages.[id:2]:not(id) -- errorMessage', {
      name: 'errorMessage',
      store: 'App',
      propName: undefined,
      storePath: ['errorMessages', {key: 'id', value: '2'}],
      just: undefined,
      not: ['id'],
    }],
    // spaces added
    ['App.errorMessages.[ id : 2 ] :not ( id )  --  errorMessage', {
      name: 'errorMessage',
      store: 'App',
      propName: undefined,
      storePath: ['errorMessages', {key: 'id', value: '2'}],
      just: undefined,
      not: ['id'],
    }],
    ['App.errorMessages.[label: Critical]', {
      name:undefined,
      store: 'App',
      propName: undefined,
      storePath: ['errorMessages', {key: 'label', value: 'Critical'}],
      just: undefined,
      not: undefined,
    }],
    ['App.config:not(session, state)', {
      name: 'config',
      store: 'App',
      propName: 'config',
      storePath: ['config'],
      just: undefined,
      not: ['session', 'state'],
    }],
    ['App.config:just(session, state)', {
      name: 'config',
      store: 'App',
      propName: 'config',
      storePath: ['config'],
      just: ['session', 'state'],
      not: undefined,
    }],
    ['App.config.list:not(status:archived) -- list', {
      name: 'list',
      store: 'App',
      propName: 'list',
      storePath: ['config', 'list'],
      just: undefined,
      not: ['status:archived'],
    }],
    ['App.config:just(session, state) | App.errorMessages.[id:2].text', [
      {
        name: 'config',
        store: 'App',
        propName: 'config',
        storePath: ['config'],
        just: ['session', 'state'],
        not: undefined,
      },
      {
        name: 'text',
        store: 'App',
        propName: 'text',
        storePath: ['errorMessages', {key: 'id', value: '2'}, 'text'],
        just: undefined,
        not: undefined,
      }
    ]],
  ],
  bad: [
    ['', 'Empty string returns undefined'],
    [{}, 'Object returns undefined'],
    [[], 'Array returns undefined'],
    [() => {}, 'Function returns undefined'],
    [NaN, 'NaN returns undefined'],
    [null, 'Null returns undefined'],
    [undefined,'Undefined returns undefined'],
    [false, 'Boolean returns undefined'],
    ['App.a+b.c', 'Badly formed App.a+b.c'],
    ['App.a.b.c:just[a, b]', 'Badly formed App.a.b.c:just[a, b]'],
    ['App.a.b.c:just(a):not:(b)', 'Badly formed App.a.b.c:just(a):not:(b)'],
    ['App.config. session', 'Badly formed App.config. session (has spaces) '],
    ['App.config:just(session, state) | App.errorMessages.[id:2]', 'One part needs a name App.config:just(session, state) | App.errorMessages.[id:2]'],
  ],
};

test('Good', t => {
  examples.good.forEach(example => {
    t.deepEqual(parse(example[0]), example[1], example[0]);
  });
  t.end();
});

test('Bad', t => {
  examples.bad.forEach(example => {
    t.throws(() => parse(example[0]), example[1]);
  });
  t.end();
});
