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
