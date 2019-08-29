module.exports = {
  method: 'GET',
  path: '/healthy',
  options: {
    handler: (request, h) => {
      return h.response('ok').code(200)
    }
  }
}
