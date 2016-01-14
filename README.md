This is a work in progress, and shouldn't be used anywhere ... Yet !

# redux-rails [![build status](https://img.shields.io/travis/gobadiah/redux-rails/master.svg?style=flat-square)](https://travis-ci.org/gobadiah/redux-rails) [![npm version](https://img.shields.io/npm/v/normalizr.svg?style=flat-square)](https://www.npmjs.com/package/normalizr) [![npm downloads](https://img.shields.io/npm/dm/normalizr.svg?style=flat-square)](https://www.npmjs.com/package/normalizr)

Redux-rails is a fork from [normalizr](https://rackt.github.io/redux). Its goal is to abstract some usual tasks when dealing with a rails api.
It also allows you to build offline apps with sync option.

## Installation

```
npm install --save redux-rails
```

## Why

When scaffolding a model in rails, there are always the same classic actions created : index, show, create, update, destroy.
Normalizr uses its own Schemas to transform the body of an api call, into a flatten structure, that can be included directly in the redux state.
Redux-rails takes this concept two step further. 

First we abstract the api call for the usual operation, create, destroy, update. In order to do that, we go the other way around, deepening a flatten state
and use rails ability to update nested models.

Second, we try to handle offline application. If the api calls don't work for lack of connection, the app becomes out of sync. You can dispatch a sync action anytime, 
that will sync with the backend, if the connection comes back.


## Usage

```javascript
import { normalize, Schema, arrayOf } from 'normalizr';
```

First, define a schema for our entities:

```javascript
const article = new Schema('articles');
const user = new Schema('users');
const collection = new Schema('collections');
```

Then we define nesting rules:

```javascript
article.define({
  author: user,
  collections: arrayOf(collection)
});

collection.define({
  curator: user
});
```

Now we can use this schema in our API response handlers:

```javascript
const ServerActionCreators = {

  // These are two different XHR endpoints with different response schemas.
  // We can use the schema objects defined earlier to express both of them:

  receiveArticles(response) {
  
    // Passing { articles: arrayOf(article) } as second parameter to normalize()
    // lets it correctly traverse the response tree and gather all entities:
    
    // BEFORE
    // {
    //   articles: [{
    //     id: 1,
    //     title: 'Some Article',
    //     author: {
    //       id: 7,
    //       name: 'Dan'
    //     }
    //   }, ...]
    // }
    //
    // AFTER:
    // {
    //   result: {
    //    articles: [1, 2, ...] // <--- Note how object array turned into ID array
    //   },
    //   entities: {
    //     articles: {
    //       1: { author: 7, ... }, // <--- Same happens for references to other entities in the schema
    //       2: { ... },
    //       ...
    //     },
    //     users: {
    //       7: { ... },
    //       ..
    //     }
    //   }
    
    response = normalize(response, {
      articles: arrayOf(article)
    });

    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_ARTICLES,
      response
    });
  },
  
  // Though this is a different API endpoint, we can describe it just as well
  // with our normalizr schema objects:

  receiveUsers(response) {

    // Passing { users: arrayOf(user) } as second parameter to normalize()
    // lets it correctly traverse the response tree and gather all entities:
    
    // BEFORE
    // {
    //   users: [{
    //     id: 7,
    //     name: 'Dan',
    //     ...
    //   }, ...]
    // }
    //
    // AFTER:
    // {
    //   result: {
    //    users: [7, ...] // <--- Note how object array turned into ID array
    //   },
    //   entities: {
    //     users: {
    //       7: { ... },
    //       ..
    //     }
    //   }
    

    response = normalize(response, {
      users: arrayOf(user)
    });

    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_USERS,
      response
    });
  }
}
```

Finally, different Stores can tune in to listen to all API responses and grab entity lists from `action.response.entities`:

```javascript
AppDispatcher.register((payload) => {
  const { action } = payload;

  if (action.response && action.response.entities && action.response.entities.users) {
    mergeUsers(action.response.entities.users);
    UserStore.emitChange();
    break;
  }
});
```

## API Reference

### `new Schema(key, [options])`

Schema lets you define a type of entity returned by your API.  
This should correspond to model in your server code.  

The `key` parameter lets you specify the name of the dictionary for this kind of entity.  

```javascript
const article = new Schema('articles');

// You can use a custom id attribute
const article = new Schema('articles', { idAttribute: 'slug' });

// Or you can specify a function to infer it
function generateSlug(entity) { /* ... */ }
const article = new Schema('articles', { idAttribute: generateSlug });
```

### `Schema.prototype.define(nestedSchema)`

Lets you specify relationships between different entities.  

```javascript
const article = new Schema('articles');
const user = new Schema('users');

article.define({
  author: user
});
```

### `arrayOf(schema, [options])`

Describes an array of the schema passed as argument.

```javascript
const article = new Schema('articles');
const user = new Schema('users');

article.define({
  author: user,
  contributors: arrayOf(user)
});
```

If the array contains entities with different schemas, you can use the `schemaAttribute` option to specify which schema to use for each entity:

```javascript
const article = new Schema('articles');
const image = new Schema('images');
const video = new Schema('videos');
const asset = {
  images: image,
  videos: video
};

// You can specify the name of the attribute that determines the schema
article.define({
  assets: arrayOf(asset, { schemaAttribute: 'type' })
});

// Or you can specify a function to infer it
function inferSchema(entity) { /* ... */ }
article.define({
  assets: arrayOf(asset, { schemaAttribute: inferSchema })
});
```

### `valuesOf(schema, [options])`

Describes a map whose values follow the schema passed as argument.

```javascript
const article = new Schema('articles');
const user = new Schema('users');

article.define({
  collaboratorsByRole: valuesOf(user)
});
```

If the map contains entities with different schemas, you can use the `schemaAttribute` option to specify which schema to use for each entity:

```javascript
const article = new Schema('articles');
const user = new Schema('images');
const group = new Schema('videos');
const collaborator = {
  users: user,
  groups: group
};

// You can specify the name of the attribute that determines the schema
article.define({
  collaboratorsByRole: valuesOf(collaborator, { schemaAttribute: 'type' })
});

// Or you can specify a function to infer it
function inferSchema(entity) { /* ... */ }
article.define({
  collaboratorsByRole: valuesOf(collaborator, { schemaAttribute: inferSchema })
});
```

### `normalize(obj, schema, [options])`

Normalizes object according to schema.  
Passed `schema` should be a nested object reflecting the structure of API response.

You may optionally specify any of the following options:

* `assignEntity` (function): This is useful if your backend emits additional fields, such as separate ID fields, you'd like to delete in the normalized entity. See [the test](https://github.com/gaearon/normalizr/blob/47ed0ecd973da6fa7c8b2de461e35b293ae52047/test/index.js#L84-L130) and the [discussion](https://github.com/gaearon/normalizr/issues/10) for a usage example.

* `mergeIntoEntity` (function): You can use this to resolve conflicts when merging entities with the same key. See [the test](https://github.com/gaearon/normalizr/blob/47ed0ecd973da6fa7c8b2de461e35b293ae52047/test/index.js#L132-L197) and the [discussion](https://github.com/gaearon/normalizr/issues/34) for a usage example.

```javascript
const article = new Schema('articles');
const user = new Schema('users');

article.define({
  author: user,
  contributors: arrayOf(user),
  meta: {
    likes: arrayOf({
      user: user
    })
  }
});

// ...

const json = getArticleArray();
const normalized = normalize(json, arrayOf(article));
```

## Explanation by Example

Say, you have `/articles` API with the following schema:

```
articles: article*

article: {
  author: user,
  likers: user*
  primary_collection: collection?
  collections: collection*
}

collection: {
  curator: user
}
```

Without normalizr, your Stores would need to know too much about API response schema.  
For example, `UserStore` would include a lot of boilerplate to extract fresh user info when articles are fetched:

```javascript
// Without normalizr, you'd have to do this in every store:

AppDispatcher.register((payload) => {
  const { action } = payload;

  switch (action.type) {
  case ActionTypes.RECEIVE_USERS:
    mergeUsers(action.rawUsers);
    break;

  case ActionTypes.RECEIVE_ARTICLES:
    action.rawArticles.forEach(rawArticle => {
      mergeUsers([rawArticle.user]);
      mergeUsers(rawArticle.likers);

      mergeUsers([rawArticle.primaryCollection.curator]);
      rawArticle.collections.forEach(rawCollection => {
        mergeUsers(rawCollection.curator);
      });
    });

    UserStore.emitChange();
    break;
  }
});
```

Normalizr solves the problem by converting API responses to a flat form where nested entities are replaced with IDs:

```javascript
{
  result: [12, 10, 3, ...],
  entities: {
    articles: {
      12: {
        authorId: 3,
        likers: [2, 1, 4],
        primaryCollection: 12,
        collections: [12, 11]
      },
      ...
    },
    users: {
      3: {
        name: 'Dan'
      },
      2: ...,
      4: ....
    },
    collections: {
      12: {
        curator: 2,
        name: 'Stuff'
      },
      ...
    }
  }
}
```

Then `UserStore` code can be rewritten as:

```javascript
// With normalizr, users are always in action.entities.users

AppDispatcher.register((payload) => {
  const { action } = payload;

  if (action.response && action.response.entities && action.response.entities.users) {
    mergeUsers(action.response.entities.users);
    UserStore.emitChange();
    break;
  }
});
```

## Dependencies

* `lodash` for `isObject`, `isEqual` and `mapValues`

## Running Tests

```
git clone https://github.com/gaearon/normalizr.git
cd normalizr
npm install
npm test # run tests once
npm run test:watch # run test watcher
```
