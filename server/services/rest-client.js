const config = require('../config')
const wreck = require('wreck').defaults({
  timeout: config.restClientTimeoutMillis
})

const self = module.exports = {
  request: async (method, url, options) => {
    const response = await wreck[method](url, options)
    return response.payload
  },

  get: async (url, options) => {
    return self.request('get', url, options)
  },

  getJson: async (url) => {
    return self.get(url, { json: true })
  },

  post: async (url, options) => {
    return self.request('post', url, options)
  },

  postJson: async (url, options) => {
    options = options || {}
    options.json = true

    return self.post(url, options)
  },

  put: async (url, options) => {
    return self.request('put', url, options)
  },

  putJson: async (url, options) => {
    options = options || {}
    options.json = true

    return self.put(url, options)
  }
}
