import 'babel-polyfill';
import EntitySchema     from './EntitySchema';
import { OneToMany, ManyToOne }
                        from './Relationships';
import { destroy }      from './destroy';
import { update }       from './update';
import { denormalize }  from './denormalize';
import middleware       from './middleware';
import idCompare        from './idCompare';
import rootElements     from './rootElements';

export { EntitySchema as Schema };

export { OneToMany, ManyToOne, update, destroy, denormalize, middleware, idCompare, rootElements };
// export { SYNC_ACTION, SYNCED_ACTION } from './constants';
export { default as reducer } from './reducer';
// export { prefixes } from './constants';
export { normalize, arrayOf, valuesOf } from './normalize';
