const config = require('../config')
const restClient = require('./rest-client')

module.exports = {
  submit: async (claim) => {
    try {
      await restClient.postJson(`${config.claimService}/submit`, { payload: claim })
      return true
    } catch (err) {
      return false
    }
  }
}
