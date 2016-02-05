This is a work in progress, and shouldn't be used anywhere ... Yet !

# redux-rails [![build status](https://img.shields.io/travis/gobadiah/redux-rails/master.svg?style=flat-square)](https://travis-ci.org/gobadiah/redux-rails) [![npm version](https://img.shields.io/npm/v/redux-rails.svg?style=flat-square)](https://www.npmjs.com/package/redux-rails) [![npm downloads](https://img.shields.io/npm/dm/redux-rails.svg?style=flat-square)](https://www.npmjs.com/package/redux-rails)

Redux rails is a fork from [normalizr](https://github.com/gaearon/normalizr) project by Dan Abramov. 

It goals is to take the idea of describing schemas, and use it not only to consume deeply nested JSON API, but also abstract away basic CRUD operations in relation with a rails api.

Redux rails is also able to work out of sync with the api, i.e. for offline apps. By adding some endpoint in your rails controller, you'll be able to sync offline data in the cloud.

# How does it work ?

First you describe your schemas like so :

    import { Schema } from 'redux-rails';
    
    const users = new Schema('users');
    const cars  = new Schema('cars');
    users.hasMany(users, 'employees', 'boss')
         .hasMany(cars, 'private_cars', 'owner');
    
    const schemas = {
      users,
      cars
    };
    
That would be the counterpart of this in rails :

    class User < ActiveRecord::Base
      has_many :private_cars, class_name: :Car, inverse_of: :owner
      has_many :employees, class_name: :User, inverse_of: :boss
      belongs_to :boss, class_name: :User, inverse_of: :employees
    
From there you need to create a middleware

    import schemas        from 'schemas';
    import { middleware } from 'redux-rails';

    const reduxRailsMiddleware = middleware(schemas, store => store.getState().myapp.get('entities'));
    
And as with any middleware

  import reduxRailsMiddleware from '

    compose(
      applyMiddleware(
        thunk,
        ...,
        reduxRailsMiddleware
      ),
      ...
    )(createStore);
    
You need to add a custom reducer to your app. We store everything in immutable Map.

    // In any reducer you want your models to be stored in
    import { schemas } from 'schemas';
    import { reducer } from 'redux-rails';
    
    const reduxRails = reducer(schemas);
    
    const myReducer(state, action) {
      state = state.update('entities', entities => reduxRails(entities, action));
      // Do other work or handle redux rails actions to do additionnal stuff
      return state;
    }
    

