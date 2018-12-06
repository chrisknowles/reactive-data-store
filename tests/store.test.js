import test from 'tape';
import {Store, Data, registerStore} from '../src/store.js';

const defaultData = {
  loading: false,
  authed: false,
  state: {
    dirty: false,
  },
  errorMessages: [
    {name: 'required', value: 'This is a required field'},
    {name: 'length', value: 'This value is too long'},
    {name: 'shorter', value: 'This value is too long'},
  ]
};

registerStore('App', defaultData);

test('Init', t => {
  t.ok(typeof Store('App') === 'object');
  t.end();
});

test('Init Data', t => {
  t.deepEquals(Data('App'), {
    loading: false,
    authed: false,
    state: {
      dirty: false,
    },
    errorMessages: [
      {name: 'required', value: 'This is a required field'},
      {name: 'length', value: 'This value is too long'},
      {name: 'shorter', value: 'This value is too long'},
    ]
  });
  t.end();
});

test('Prop Value From Path', t => {
  t.notOk(Data('App.state.dirty'));
  t.end();
});

test('Prop Value From Key Val', t => {
  t.deepEqual(Data('App.errorMessages.[name:required]'), {name: 'required', value: 'This is a required field'});
  t.end();
});

test('Prop Value From Key Val', t => {
  t.deepEqual(Data('App.errorMessages.[name:required].value'), 'This is a required field');
  t.end();
});

test('Update Data', t => {
  const data = Data('App');
  data.loading = true;
  Store('App').update({...data});
  t.deepEquals(Data('App'), {
    loading: true,
    authed: false,
    state: {
      dirty: false,
    },
    errorMessages: [
      {name: 'required', value: 'This is a required field'},
      {name: 'length', value: 'This value is too long'},
      {name: 'shorter', value: 'This value is too long'},
    ]
  });
  t.end();
});

test('Update Nested Data', t => {
  const data = Data('App');
  data.state.dirty = true;
  Store('App').update({...data});
  t.deepEquals(Data('App'), {
    loading: true,
    authed: false,
    state: {
      dirty: true,
    },
    errorMessages: [
      {name: 'required', value: 'This is a required field'},
      {name: 'length', value: 'This value is too long'},
      {name: 'shorter', value: 'This value is too long'},
    ]
  });
  t.end();
});

test('Update Prop Only', t => {
  const data = Data('App');
  Store('App').update({...data, ...{authed: true}});
  t.deepEquals(Data('App'), {
    loading: true,
    authed: true,
    state: {
      dirty: true,
    },
    errorMessages: [
      {name: 'required', value: 'This is a required field'},
      {name: 'length', value: 'This value is too long'},
      {name: 'shorter', value: 'This value is too long'},
    ]
  });
  t.end();
});
