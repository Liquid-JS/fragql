# FraGQL

## Example

```js
import { gql } from '@liquid-js/fragql'

const userBasic = gql`
fragment userBasic on User {
    name
    lastname
}
`

const query = gql`
query user($id: String){
    user(id: $id){
        ...${userBasic}
    }
}
`
```

### Fragmented string

```js
console.log(query.toString())
```

Gives

```gql
query user($id: String) {
  user(id: $id) {
    ...userBasic
  }
}

fragment userBasic on User {
  name
  lastname
}
```

### Flat string

```js
console.log(query.toString(true))
```

Gives

```gql
query user($id: String) {
  user(id: $id) {
    name
    lastname
  }
}
```

## Schema validation

FraGQL can validate operations against GQL schema. To use validation,
you have to pass your schema as a string to `loadSchema` function.

### Validating agains GraphQL endpoint

The following example obtains GraphQL schema from `http://example.com/graphql`
and validates `user` query against it. 

Notice `userBasic` fragment and `user` query don't wait for the schema to load -
upon calling `loadSchema`, all existing queries are validated against it.

```js
import { gql, loadSchema } from '@liquid-js/fragql'
import { buildClientSchema, introspectionQuery } from 'graphql'

fetch('http://example.com/graphql', {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
        'Content-Type': 'application/json; charset=utf-8'
    },
    redirect: 'follow',
    referrer: 'no-referrer',
    body: JSON.stringify({ query: introspectionQuery })
})
    .then(res => res.json())
    .then(res => buildClientSchema(res.data))
    .then(schema => loadSchema(schema))
    .then(errors => {
        if (errors.length)
            throw errors[0]
    })

const userBasic = gql`
fragment userBasic on User {
    name
    lastname
}
`

const query = gql`
query user($id: String){
    user(id: $id){
        ...${userBasic}
    }
}
`
```
