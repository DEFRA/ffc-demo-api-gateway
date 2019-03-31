const config = require('../config')
const restClient = require('./rest-client')
const _ = require('lodash')

module.exports = {
  submit: async (claim) => {
    try {
      await restClient.postJson(`${config.claim}/submit`, { payload: claim })
      return true
    } catch (err) {      
      return false
    }
  }
}
