import * as Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'
import {
  Module,
  Mutations,
  Actions,
  registerModule,
  unregisterModule,
} from '../src'

const localVue = createLocalVue()
localVue.use(Vuex)

class TestState {
  count = 0
}

class TestMutations extends Mutations<TestState> {
  inc() {
    this.state.count++
  }
}

class TestActions extends Actions<TestState, never, TestMutations> {
  inc() {
    this.commit('inc')
  }
}

let test: Module<TestState, never, TestMutations, any, any>

beforeEach(() => {
  test = new Module({
    state: TestState,
    mutations: TestMutations,
    actions: TestActions,
  })
})

describe('registerModule', () => {
  it('registers module', () => {
    const store = new Vuex.Store<any>({})
    registerModule(store, 'test', 'test', test)

    expect(store.state.test.count).toBe(0)
    store.commit('test/inc')
    expect(store.state.test.count).toBe(1)
  })

  it('prefixes the namespace for calls via a nested module action', () => {
    const store = new Vuex.Store<any>({})
    const parent = new Module({
      modules: {
        test,
      },
    })
    registerModule(store, 'parent', 'parent', parent)

    expect(store.state.parent.test.count).toBe(0)
    store.dispatch('parent/test/inc')
    expect(store.state.parent.test.count).toBe(1)
  })

  it('passes module options of vuex', () => {
    const store = new Vuex.Store<any>({})
    store.replaceState({
      test: {
        count: 10,
      },
    })

    registerModule(store, 'test', 'test', test, {
      preserveState: true,
    })

    expect(store.state.test.count).toBe(10)
  })

  it('calls $init hook', (done) => {
    class FooActions extends Actions<{}, never, any, FooActions> {
      $init() {
        done()
      }
    }

    const foo = new Module({
      actions: FooActions,
    })

    const store = new Vuex.Store({})
    registerModule(store, ['foo'], 'foo', foo)
  })
})

describe('unregisterModule', () => {
  it('unregisters module', () => {
    const store = new Vuex.Store<any>({})

    registerModule(store, 'test', 'test', test)
    unregisterModule(store, test)

    expect(store.state.test).toBe(undefined)
  })
})
