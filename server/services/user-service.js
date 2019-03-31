const config = require('../config')
const restClient = require('./rest-client')
const _ = require('lodash')

module.exports = {
  register: async (user) => {
    try {
      await restClient.postJson(`${config.userService}/register`, { payload: user })
      return true
    } catch (err) {
      return false
    }
  }
}
