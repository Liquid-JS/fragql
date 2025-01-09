import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { clearDefnitions, gql, metadata } from './gql.js'
import { renderMetadata } from './render.js'

@suite('GQL tag')
export class GQLTest {
    before() {
        clearDefnitions()
    }

    @test('Properly includes fragments and fragment spread')
    combine() {
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

        expect(query.toString()).to.equal(`query user($id: String) {
  user(id: $id) {
    ...userBasic
  }
  __typename
}

fragment userBasic on User {
  name
  lastname
  __typename
}`)
    }

    @test('Properly flattens fragment')
    flat() {
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

        expect(query.toString(true)).to.equal(`query user($id: String) {
  user(id: $id) {
    name
    lastname
    __typename
  }
  __typename
}`)
    }

    @test('Provides metadata')
    async metadata() {
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

        query.toString()

        expect(metadata).to.deep.equal({
            fragments: {
                'fragment_user-basic': {
                    name: 'userBasic',
                    body: 'fragment userBasic on User {\n  name\n  lastname\n  __typename\n}',
                    dependsOn: new Set(),
                    dependencyKeyMap: {},
                    onType: 'User',
                    variables: {},
                    str: 'fragment userBasic on User {\n  name\n  lastname\n  __typename\n}'
                }
            },
            operations: {
                operation_user: {
                    name: 'user',
                    body: 'query user($id: String) {\n  user(id: $id) {\n    ...userBasic\n  }\n  __typename\n}',
                    dependsOn: new Set(['fragment_user-basic']),
                    dependencyKeyMap: {
                        userBasic: 'fragment_user-basic'
                    },
                    variables: {
                        id: '...'
                    },
                    str: 'query user($id: String) {\n  user(id: $id) {\n    ...userBasic\n  }\n  __typename\n}\n\nfragment userBasic on User {\n  name\n  lastname\n  __typename\n}'
                }
            }
        })

        await renderMetadata(metadata, './tmp/meta')
    }
}
