describe('Web test', () => {
  let createServer
  let server

  beforeAll(async () => {
    jest.mock('../server/services/rest-client')
    createServer = require('../server')
  })

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
    jest.clearAllMocks()
  })

  test('GET / route returns 404', async () => {
    const options = {
      method: 'GET',
      url: '/'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(404)
    expect((response.headers['content-type'])).toEqual(expect.stringContaining('application/json'))
  })

  test('POST /claim route fails with invalid content', async () => {
    const restClient = require('../server/services/rest-client')
    const options = {
      method: 'POST',
      url: '/claim',
      payload: { }
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(400)
    expect(restClient.postJson).toHaveBeenCalledTimes(0)
  })

  test('POST /claim route works with valid content', async () => {
    const restClient = require('../server/services/rest-client')
    const options = {
      method: 'POST',
      url: '/claim',
      payload: { claimId: 'MINE123',
        propertyType: 'business',
        accessible: false,
        dateOfSubsidence: new Date(),
        mineType: ['gold', 'iron'],
        email: 'nobody@example.com'
      }
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(restClient.postJson).toHaveBeenCalledTimes(2)
  })

  afterEach(async () => {
    await server.stop()
  })

  afterAll(async () => {
    jest.unmock('../server/services/rest-client')
  })
})
