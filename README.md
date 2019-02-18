# Reactive Data Store

A reactive data store that can be subscribed to and accessed using string paths. 

The motivation for this library is to have a reactive store that:

* can be subscribed to by a string path
* whose data stream will only call the subscription callback when data defined by the string path changes
* whose data can be directly accessed by a string path
* and only the data defined by the string path is returned

[See an example integration with a custom element.](https://github.com/chrisknowles/reactive-custom-element)

## Usage

```javascript
import {
  Store, 
  Data,
  registerStore,
} from 'reactive-data-store';

registerStore('App', {
  status: {
    dirty: false,
  },
});

registerStore('MyStore', {
  title: 'My Store',
  items: {
    a: {id: 1, desc: 'Item A'},
    b: {id: 2, desc: 'Item B'},
  },
  list: [
    {id: 1, name: 'item1', desc: 'List Item 1', rank: 1},
    {id: 2, name: 'item2', desc: 'List Item 2', rank: 2},
  ],
});

// SUBSCRIPTIONS

// will receive updates if title or list changes
// data -> {title, list}
Store('MyStore').subscribe(callback);

// will only receive updates if title changes
// data -> {title}
Store('MyStore.title').subscribe(callback);

// will only receive updates if items.a changes
// data -> {id, desc}
Store('MyStore.items.a').subscribe(callback);

// will only receive updates if the obj with id 2 changes
// data -> {id, name, desc, rank}
Store('MyStore.list[id: 2]').subscribe(callback);

// will only receive updates if the obj with id 2 desc property changes
// data -> {name, desc}
Store('MyStore.list[id: 2]:just(name, desc)').subscribe(callback);

// will only receive updates if the obj with id 2 desc property changes
// data -> {desc, rank}
Store('MyStore.list[id: 2]:not(id, name)').subscribe(callback);

// subscribes to 2 stores
// will only receive updates if the dirty property of App.state changes
// or the obj with id 2 of MyStore.list changes 
// data -> {id, name, desc, rank}
Store('App.state.dirty | MyStore.list[id: 2]').subscribe(callback);

// this will use the provided name like so
// data -> {newName: {id, desc}}
Store('MyStore.items.a -- newName').subscribe(callback);

// DATA ACCESS

// {title, list}
Data('MyStore'); 

// the value of title e.g. 'My Store'
Data('MyStore.title'); 

// {id, desc}
Data('MyStore.items.a')

// {id, name, desc, rank}
Data('MyStore.list[id: 2]'); 

// {name, desc}
Data('MyStore.list[id: 2]:just(name, desc)'); 

// {dec, rank}
Data('MyStore.list[id: 2]:not(id, name)'); 

// the value of rank e.g. 2
Data('MyStore.list[id: 2].rank'); 
```

Only copies of the data are returned and the store is updated by an `update` method. So to update some data, retrieve it from the store with `Data`, change it, then call `update` which will spread the update data onto the existing store data.

```javascript
Store('MyStore').update({title: 'New Title'});
```
```javascript
const items = Data('MyStore.items);
items.a.desc = 'New Description';
Store('MyStore').update({items});
```

This way UI elements can subscribe independently to stores and specifically to selected properties on stores and not rely on parent elements to provide updates. It also allows for direct access to data by string paths that target specific store properties.

## Usage with View Libraries

### Native Custom Elements

### React

There are 2 ways to integate the store with React.

**Higher Order Component**

```javascript

```

**Provider Component**

```javascript

```


### Vue

```javascript

```


### Motivaition

The motivation is twofold. Firstly to help decouple elements from hierarchical structures and to allow quick access to data points. In essence the underlying purpose of the library is to make a reactive data store accessible in a declarative way.

When used with custom elements, those elements can be provided a path to use so they can subscribe themselves. Then they will be directly updated by the store rather than have the need for the parent element to manage this.

When you subscribe to a nested property your callback will only be called when that property changes. It will not be called if other properties on the store change saving the need for checking in the elements lifecycle hooks. This also goes for if you subscribe to a nested property and filter with `:just` or `:not` - your callback will only be called if your filtered properties change.

## Usage

### Store Instance

```javascript

store.data.list

import {
  Store, 
  registerStore, 
  setStoreDebugging, 
  setStoreSession
} from 'reactive-data-store';

// will cause the store to dump info to console
setStoreDebugging(true);

// false is default. If set to true, all stores are saved and 
// loaded to/from local session storage 
setStoreSession(false); 

// initialise with a default object and a function to call to 
// lazy load data when the sotre is first subscribed to
registerStore('StoreName', defaultData, fetchData);

// returns a store instance
Store('StoreName');  

// Update the store data
Store('StoreName').update({...});  

// Subscribe to the store
Store('StoreName').subscribe(() => {});  

// Subscribe to just a data point on the store
Store('StoreName.first.second').subscribe(() => {});  

// Subscribe to just to two data points on the store
Store('StoreName.first:just(second, third)').subscribe(() => {});  

// Subscribe to a data point and exclude some of it's properties
Store('StoreName.first:not(fourth, fifth)').subscribe(() => {});  

// Subscribe to just to an object with id '4' in the array 'first'
Store('StoreName.first.[id:4]').subscribe(() => {});  

// Subscribe to just to an object with id '4' in the array 'first'
// and take one proeprty
Store('StoreName.first.[id:4].name').subscribe(() => {});  

// Subscribe to just to an object with id '4' in the array 'first'
// and then filter
Store('StoreName.first.[id:4]:just(name, description)').subscribe(() => {});  
```

### Store Data

`Data()` has the same api as for `Store()` except it returns data

```javascript
import {Data} from 'reactive-data-store';

// get all the data from the store
Data('StoreName');

// Returns the data of the 'second' property
Data('StoreName.first.second');
```

This becomes very useful for use with custom elements where you create a base element class that hooks up elements to the sore via `data-store` attributes or similar.

```html
<my-element data-store='App.state.publish.dirty'></my-element>
```

my-element.js

```javascript
import {html} from 'lit-html';

class MyElement extends CustomElement {

  // It's assumed that this extends a base class CustomElement in turn
  // extends HTMLElement and that wraps  the functionality of rendering 
  // the component and providing an update function that sets the 
  // 'this.props' property with the updates from the store

  connectedCallback() {
    this.render();
  }

  template() {
    return html`
      <div ?hidden=${this.props.dirty}>
        ...
      </div>
    `;
  }
}

window.customElements.define('my-element', MyElement>);
```

## License

MIT - see LICENSE.md
