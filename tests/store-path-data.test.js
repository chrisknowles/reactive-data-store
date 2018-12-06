import test from 'tape';
import {parse, getDataFromPath} from '../src/store-path.js';

const stores = {
  User: {
    label: 'User',
    info: {
      username: 'Chris',
      email: false,
    },
    contacts: [
      {id: '1', name: 'Jesse'},
      {id: '2', name: 'Sam', drinks: [
        {id: 1, name: 'beer', ingredients:['water', 'hops']},
        {id: 2, name: 'gin', ingredients:['water', 'juniper']},
      ]},
    ],
  }
};

test('User.info.username', t => {
  let store = parse('User.info.username');
  t.deepEqual(getDataFromPath({...store, data: stores.User}), 'Chris');
  t.end();
});

test('User.info', t => {
  const store = parse('User.info');
  t.deepEqual(getDataFromPath({...store, data: stores.User}), {username: 'Chris', email: false});
  t.end();
});

test('User.info:just(username)', t => {
  const store = parse('User.info:just(username)');
  t.deepEqual(getDataFromPath({...store, data: stores.User}), 'Chris');
  t.end();
});

test('User.info:not(username)', t => {
  const store = parse('User.info:not(username)');
  t.deepEqual(getDataFromPath({...store, data: stores.User}), {email: false});
  t.end();
});

test('User.info:not(username)', t => {
  const store = parse('User.info:not(usernme)'); // mis-spelled username
  t.deepEqual(getDataFromPath({...store, data: stores.User}), { username: 'Chris', email: false });
  t.end();
});

test('User.info:not(username)', t => {
  const store = parse('User.inf'); // mis-spelled info
  t.deepEqual(getDataFromPath({...store, data: stores.User}), undefined);
  t.end();
});

test('User:just(info, contacts) -- stuff', t => {
  const store = parse('User:just(info, contacts) -- stuff');
  t.deepEqual(getDataFromPath({...store, data: stores.User}), {
    stuff: {
      info: {
        username: 'Chris',
        email: false,
      },
      contacts: [
        {id: '1', name: 'Jesse'},
        {id: '2', name: 'Sam', drinks: [
          {id: 1, name: 'beer', ingredients:['water', 'hops']},
          {id: 2, name: 'gin', ingredients:['water', 'juniper']},
        ]},
      ]
    }
  });
  t.end();
});

test('User.contacts.[id:2]', t => {
  const store = parse('User.contacts.[id:2]');
  t.deepEqual(getDataFromPath({...store, data: stores.User}),
    {id: '2', name: 'Sam', drinks: [
      {id: 1, name: 'beer', ingredients:['water', 'hops']},
      {id: 2, name: 'gin', ingredients:['water', 'juniper']},
    ]},
  );
  t.end();
});

test('User.contacts.[name:Jesse]', t => {
  const store = parse('User.contacts.[name:Jesse]');
  t.deepEqual(getDataFromPath({...store, data: stores.User}),
  {id: '1', name: 'Jesse'},
  );
  t.end();
});

// test('ingredients < User.contacts.[id:2][id:2]:just(ingredients)', t => {
//   const store = parse('ingredients < User.contacts.[id:2][id:2]:just(ingredients)');
//   t.deepEqual(getDataFromPath({...store, data: stores.User}), {
//     ingredients: ['water', 'juniper']
//   });
//   t.end();
// });
