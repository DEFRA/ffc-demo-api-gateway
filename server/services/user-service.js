const config = require('../config')
const restClient = require('./rest-client')

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
